import type { AjoCycle, AjoGroupDetail } from '@/api/endpoints/ajo-groups';
import {
  buildRotation,
  canLock,
  canRequestSwap,
  currentRotationSequence,
  lockBlockedReason,
  outstandingContributions,
  rotationStatusLabel,
  rotationStatusTone,
} from './rotation';

const ME = 'user-me';
const THEM = 'user-them';

const group = {
  status: 'LOCKED',
  slots: [
    { id: 'slot-1', memberId: 'member-1', position: 1, status: 'ACTIVE' },
    { id: 'slot-2', memberId: 'member-2', position: 2, status: 'ACTIVE' },
  ],
  members: [
    {
      id: 'member-1',
      userId: ME,
      role: 'MEMBER',
      status: 'ACTIVE',
      displayName: 'Ada Admin',
      _count: { slots: 1 },
    },
    {
      id: 'member-2',
      userId: THEM,
      role: 'GROUP_ADMIN',
      status: 'ACTIVE',
      displayName: 'Bisi Adeyemi',
      _count: { slots: 1 },
    },
  ],
} satisfies Pick<AjoGroupDetail, 'status' | 'slots' | 'members'>;

// The schedule id is distinct from the slot id on purpose: they are different
// rows, and a payment settles the schedule.
const row = (slotId: string, status = 'PENDING') => ({
  id: `sched-${slotId}`,
  slotId,
  amountDueMinor: '1000000',
  amountPaidMinor: '0',
  currency: 'NGN',
  status,
});

const cycles: AjoCycle[] = [
  {
    sequence: 1,
    contributionDueAt: '2026-10-01T00:00:00.000Z',
    payoutDueAt: '2026-10-01T00:00:00.000Z',
    status: 'PENDING',
    contributionSchedules: [row('slot-1'), row('slot-2')],
    payoutSchedules: [row('slot-1')],
  },
  {
    sequence: 2,
    contributionDueAt: '2026-11-01T00:00:00.000Z',
    payoutDueAt: '2026-11-01T00:00:00.000Z',
    status: 'PENDING',
    contributionSchedules: [row('slot-1'), row('slot-2')],
    payoutSchedules: [row('slot-2')],
  },
];

describe('buildRotation', () => {
  it('names who receives each payout', () => {
    // The schedule endpoint returns slot ids only, so without this join the
    // screen could not say whose turn it is.
    const rotation = buildRotation(cycles, group, ME);
    expect(rotation.map((r) => [r.sequence, r.holderName])).toEqual([
      [1, 'Ada Admin'],
      [2, 'Bisi Adeyemi'],
    ]);
  });

  it('marks the viewer’s own turn', () => {
    const rotation = buildRotation(cycles, group, ME);
    expect(rotation.map((r) => r.isMine)).toEqual([true, false]);
  });

  it('marks nothing as mine when the viewer is unknown', () => {
    expect(buildRotation(cycles, group, null).every((r) => !r.isMine)).toBe(true);
  });

  it('still renders a row whose slot is missing from the group payload', () => {
    // The two requests are not atomic, so a slot can disappear between them.
    const rotation = buildRotation(cycles, { ...group, slots: [] }, ME);
    expect(rotation).toHaveLength(2);
    expect(rotation[0]?.holderName).toBe('Member');
  });
});

describe('outstandingContributions', () => {
  it('returns only the viewer’s own unpaid rows', () => {
    // An admin's schedule contains every member's rows, so filtering by slot
    // ownership is what keeps another member's dues off this list.
    const mine = outstandingContributions(cycles, group, ME);
    expect(mine).toHaveLength(2);
    expect(mine.every((row) => row.slotId === 'slot-1')).toBe(true);
  });

  it('excludes rows that are already paid', () => {
    const paid: AjoCycle[] = [{ ...cycles[0]!, contributionSchedules: [row('slot-1', 'PAID')] }];
    expect(outstandingContributions(paid, group, ME)).toHaveLength(0);
  });

  it('orders by due date so the soonest is first', () => {
    const reversed = [cycles[1]!, cycles[0]!];
    const mine = outstandingContributions(reversed, group, ME);
    expect(mine[0]?.dueAt).toBe('2026-10-01T00:00:00.000Z');
  });

  it('returns nothing for a viewer who holds no slots', () => {
    expect(outstandingContributions(cycles, group, 'nobody')).toHaveLength(0);
  });
});

describe('canLock', () => {
  it('allows the group admin before the schedule exists', () => {
    expect(canLock({ status: 'DRAFT', members: group.members }, THEM)).toBe(true);
  });

  it('refuses an ordinary member', () => {
    expect(canLock({ status: 'DRAFT', members: group.members }, ME)).toBe(false);
  });

  it('refuses once already locked, because the schedule is immutable', () => {
    expect(canLock({ status: 'LOCKED', members: group.members }, THEM)).toBe(false);
  });
});

describe('canRequestSwap', () => {
  it('allows a swap on a locked rotation with more than one position', () => {
    expect(canRequestSwap(group)).toBe(true);
  });

  it('refuses before the rotation is locked, when there are no positions to trade', () => {
    expect(canRequestSwap({ ...group, status: 'DRAFT' })).toBe(false);
  });

  it('refuses when there is nothing to swap with', () => {
    expect(canRequestSwap({ ...group, slots: [group.slots[0]!] })).toBe(false);
  });
});

describe('lockBlockedReason', () => {
  it('blocks a group with only one position taken, and says why', () => {
    // The backend returns 422 for this. Discovering it by tapping is a dead end;
    // the message names the action that unblocks it.
    const reason = lockBlockedReason({ slots: [group.slots[0]!] });
    expect(reason).toMatch(/share the invitation/i);
  });

  it('blocks an empty group', () => {
    expect(lockBlockedReason({ slots: [] })).not.toBeNull();
  });

  it('allows locking once two positions are taken', () => {
    expect(lockBlockedReason(group)).toBeNull();
  });
});

describe('rotation status wording', () => {
  it('words a settled payout as paid out, whether or not it is current', () => {
    expect(rotationStatusLabel('PAID', false)).toBe('Paid out');
    expect(rotationStatusLabel('PAID', true)).toBe('Paid out');
  });

  it('distinguishes the live round from the ones still to come', () => {
    // Every row would otherwise read "Upcoming", including the one whose money
    // is due now — the only row that asks anything of anybody.
    expect(rotationStatusLabel('PENDING', true)).toBe('Current');
    expect(rotationStatusLabel('PENDING', false)).toBe('Upcoming');
  });

  it('calls out a payout that failed rather than leaving it as pending', () => {
    expect(rotationStatusLabel('FAILED', false)).toBe('Failed');
    expect(rotationStatusTone('FAILED', false)).toBe('error');
  });

  it('gives each state a tone that is never the only signal', () => {
    expect(rotationStatusTone('PAID', false)).toBe('success');
    expect(rotationStatusTone('PROCESSING', false)).toBe('info');
    expect(rotationStatusTone('PENDING', true)).toBe('warning');
    expect(rotationStatusTone('PENDING', false)).toBe('neutral');
  });
});

describe('currentRotationSequence', () => {
  function row(sequence: number, status: string) {
    return {
      sequence,
      slotId: `s${sequence}`,
      position: sequence,
      holderName: 'Member',
      payoutDueAt: '2026-09-15T00:00:00Z',
      amountDueMinor: '100000',
      amountPaidMinor: '0',
      currency: 'NGN',
      status,
      isMine: false,
    };
  }

  it('points at the earliest round still owing a payout', () => {
    expect(currentRotationSequence([row(1, 'PAID'), row(2, 'PENDING'), row(3, 'PENDING')])).toBe(2);
  });

  it('does not assume the rows arrive in order', () => {
    expect(currentRotationSequence([row(3, 'PENDING'), row(1, 'PAID'), row(2, 'PENDING')])).toBe(2);
  });

  it('marks nothing current once every round has paid out', () => {
    // A finished rotation pointing at its last row forever would keep showing a
    // completed group as though money were still due.
    expect(currentRotationSequence([row(1, 'PAID'), row(2, 'PAID')])).toBeNull();
  });

  it('has no current round before the group is locked', () => {
    expect(currentRotationSequence([])).toBeNull();
  });
});
