import type { AjoSwapRequest } from '@/api/endpoints/ajo-groups';

import {
  canDecide,
  deadlineLabel,
  hoursRemaining,
  otherSwaps,
  pendingMyDecision,
  statusLabel,
  swapSummary,
} from './swap-approvals';

const now = new Date('2026-09-02T12:00:00.000Z');

const swap = (overrides: Partial<AjoSwapRequest> = {}): AjoSwapRequest => ({
  id: 'swap-1',
  status: 'PENDING',
  initiatorType: 'MEMBER',
  requestedByMemberId: 'member-bola',
  from: { slotId: 'slot-2', position: 2, memberId: 'member-bola', displayName: 'Bola Adeyemi' },
  to: { slotId: 'slot-1', position: 1, memberId: 'member-ada', displayName: 'Ada Okafor' },
  reason: 'Travelling in March',
  expiresAt: '2026-09-04T12:00:00.000Z',
  decidedAt: null,
  executedAt: null,
  createdAt: '2026-09-01T12:00:00.000Z',
  approvals: [],
  awaitingMyDecision: true,
  ...overrides,
});

describe('pendingMyDecision', () => {
  it('surfaces only what this member must act on', () => {
    const mine = swap();
    const theirs = swap({ id: 'swap-2', awaitingMyDecision: false });
    expect(pendingMyDecision([mine, theirs])).toEqual([mine]);
    expect(otherSwaps([mine, theirs])).toEqual([theirs]);
  });
});

describe('swapSummary', () => {
  it('describes the trade by name and position', () => {
    expect(swapSummary(swap())).toBe(
      'Bola Adeyemi (position 2) and Ada Okafor (position 1) would trade places',
    );
  });

  it('survives a position the server could not resolve', () => {
    const missing = swap({
      from: { slotId: 'slot-2', position: null, memberId: null, displayName: 'Member' },
    });
    expect(swapSummary(missing)).toContain('position ?');
  });
});

describe('statusLabel', () => {
  it('distinguishes waiting for you from waiting for them', () => {
    expect(statusLabel(swap())).toBe('Waiting for you');
    expect(statusLabel(swap({ awaitingMyDecision: false }))).toBe('Waiting for the other member');
  });

  it('says what happened once settled', () => {
    expect(statusLabel(swap({ status: 'EXECUTED' }))).toBe('Done — the rotation was updated');
    expect(statusLabel(swap({ status: 'EXPIRED' }))).toBe('Expired without a decision');
    expect(statusLabel(swap({ status: 'REJECTED' }))).toBe('Declined');
  });
});

describe('hoursRemaining', () => {
  it('rounds up so a partial hour never reads as zero', () => {
    const soon = swap({ expiresAt: '2026-09-02T12:40:00.000Z' });
    expect(hoursRemaining(soon, now)).toBe(1);
  });

  it('is null once the deadline has passed', () => {
    expect(hoursRemaining(swap({ expiresAt: '2026-09-02T11:00:00.000Z' }), now)).toBeNull();
  });

  it('is null for a settled request', () => {
    expect(hoursRemaining(swap({ status: 'EXECUTED' }), now)).toBeNull();
  });
});

describe('deadlineLabel', () => {
  it('reads naturally near the deadline', () => {
    expect(deadlineLabel(swap({ expiresAt: '2026-09-02T12:30:00.000Z' }), now)).toBe(
      'Less than an hour left to decide',
    );
  });

  it('counts hours within a day', () => {
    expect(deadlineLabel(swap({ expiresAt: '2026-09-02T20:00:00.000Z' }), now)).toBe(
      '8 hours left to decide',
    );
  });

  it('switches to days beyond one', () => {
    expect(deadlineLabel(swap({ expiresAt: '2026-09-04T12:00:00.000Z' }), now)).toBe(
      '2 days left to decide',
    );
  });

  it('says nothing once the deadline has passed', () => {
    expect(deadlineLabel(swap({ expiresAt: '2026-09-01T12:00:00.000Z' }), now)).toBeNull();
  });
});

describe('canDecide', () => {
  it('offers the buttons on a live request that awaits this member', () => {
    expect(canDecide(swap(), now)).toBe(true);
  });

  it('hides them when the request is not this member to decide', () => {
    expect(canDecide(swap({ awaitingMyDecision: false }), now)).toBe(false);
  });

  it('hides them once the deadline has passed', () => {
    // The server refuses an expired request, so offering the button would
    // produce an error the member could not have predicted.
    expect(canDecide(swap({ expiresAt: '2026-09-02T11:59:00.000Z' }), now)).toBe(false);
  });

  it('hides them on a settled request', () => {
    expect(canDecide(swap({ status: 'EXECUTED' }), now)).toBe(false);
  });
});
