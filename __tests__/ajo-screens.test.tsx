import { act, fireEvent, render } from '@testing-library/react-native';

import type { AjoGroupDetail } from '@/api/endpoints/ajo-groups';
import { AjoDetailScreen } from '@/features/ajo/ajo-detail-screen';
import { CreateGroupScreen } from '@/features/ajo/create-group-screen';
import { GroupInvitationScreen } from '@/features/ajo/group-invitation-screen';
import { SwapRequestScreen } from '@/features/ajo/swap-request-screen';

const ME = 'user-me';

const group: AjoGroupDetail = {
  id: 'group-1',
  name: 'Family Rotation',
  description: null,
  status: 'LOCKED',
  contributionFrequency: 'MONTHLY',
  contributionMode: 'FIXED',
  baseContributionMinor: '1000000',
  currency: 'NGN',
  maxSlots: 2,
  maxMembers: 1000,
  minSlotsPerMember: 1,
  maxSlotsPerMember: 2,
  businessTimezone: 'Africa/Lagos',
  startDate: '2026-10-01T00:00:00.000Z',
  endDate: '2026-12-01T00:00:00.000Z',
  lockedAt: '2026-09-02T00:00:00.000Z',
  members: [
    {
      id: 'm1',
      userId: ME,
      role: 'MEMBER',
      status: 'ACTIVE',
      displayName: 'Ada Admin',
      _count: { slots: 1 },
    },
    {
      id: 'm2',
      userId: 'other',
      role: 'GROUP_ADMIN',
      status: 'ACTIVE',
      displayName: 'Bisi Adeyemi',
      _count: { slots: 1 },
    },
  ],
  slots: [
    { id: 'slot-1', memberId: 'm1', position: 1, status: 'ACTIVE' },
    { id: 'slot-2', memberId: 'm2', position: 2, status: 'ACTIVE' },
  ],
  _count: { slots: 2, members: 2 },
};

const cycles = [
  {
    sequence: 1,
    contributionDueAt: '2026-10-01T00:00:00.000Z',
    payoutDueAt: '2026-10-01T00:00:00.000Z',
    status: 'PENDING',
    contributionSchedules: [
      {
        slotId: 'slot-1',
        amountDueMinor: '1000000',
        amountPaidMinor: '0',
        currency: 'NGN',
        status: 'PENDING',
      },
    ],
    payoutSchedules: [
      {
        slotId: 'slot-1',
        amountDueMinor: '2000000',
        amountPaidMinor: '0',
        currency: 'NGN',
        status: 'PENDING',
      },
    ],
  },
];

describe('CreateGroupScreen', () => {
  // Awaited inside the helper: returning the un-awaited render and awaiting it
  // at the call site leaves React mid-render when the next act() opens.
  const setup = async (onSubmit = jest.fn()) =>
    await render(<CreateGroupScreen submitting={false} onSubmit={onSubmit} />);

  it('does not advance past a step with an invalid field', async () => {
    const view = await setup();
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    });
    // Still on step 1: the name and amount were never filled in.
    expect(view.getByText('Step 1 of 4')).toBeTruthy();
    expect(view.getByText(/at least 3 characters/i)).toBeTruthy();
  });

  it('advances once the step is valid', async () => {
    const view = await setup();
    // Typing and pressing are separate acts: the Continue handler reads state
    // the first act has to have flushed. React logs an overlapping-act warning
    // for this pattern; the alternative - bare fireEvent - leaves React
    // mid-update and breaks the tests that follow, so the warning is accepted.
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('Group name'), 'Family Rotation');
      fireEvent.changeText(view.getByLabelText('Contribution per position'), '10000');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    });
    expect(view.getByText('Step 2 of 4')).toBeTruthy();
  });
});

describe('GroupInvitationScreen', () => {
  it('shows the code and warns it cannot be seen again', async () => {
    // The backend stores only a digest, so this screen is the single chance to
    // capture the code.
    const view = await render(
      <GroupInvitationScreen
        groupName="Family Rotation"
        groupId="group-1"
        invitationCode="abcdef123456"
        onDone={jest.fn()}
      />,
    );
    expect(view.getByText('abcdef123456')).toBeTruthy();
    expect(view.getByText(/not be able to see the code again/i)).toBeTruthy();
  });
});

describe('AjoDetailScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <AjoDetailScreen
        group={group}
        cycles={cycles}
        viewerUserId={ME}
        loading={false}
        error={false}
        onRetry={jest.fn()}
        onLock={jest.fn()}
        onRequestSwap={jest.fn()}
        onViewSwaps={jest.fn()}
        swapsAwaitingMe={0}
        onPayContribution={jest.fn()}
        {...overrides}
      />,
    );

  it('names who receives each payout rather than showing a slot id', async () => {
    const view = await setup();
    expect(view.getByText('Ada Admin (you)')).toBeTruthy();
  });

  it('offers to pay the viewer’s own next contribution', async () => {
    const onPayContribution = jest.fn();
    const view = await setup({ onPayContribution });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay contribution' }));
    });
    expect(onPayContribution).toHaveBeenCalledWith(
      expect.objectContaining({ slotId: 'slot-1', amountMinor: '1000000' }),
    );
  });

  it('hides the lock action from a member who is not the administrator', async () => {
    const view = await setup();
    expect(view.queryByRole('button', { name: 'Lock the rotation' })).toBeNull();
  });

  it('offers locking to the administrator before the schedule exists', async () => {
    const view = await setup({
      group: { ...group, status: 'DRAFT' },
      viewerUserId: 'other',
      cycles: [],
    });
    expect(view.getByRole('button', { name: 'Lock the rotation' })).toBeTruthy();
  });

  it('explains that the order is set at lock time when there is no schedule', async () => {
    const view = await setup({ cycles: [] });
    expect(view.getByText(/order is set when the group is locked/i)).toBeTruthy();
  });
});

describe('SwapRequestScreen', () => {
  it('will not send until a position to swap with is chosen', async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <SwapRequestScreen group={group} viewerUserId={ME} submitting={false} onSubmit={onSubmit} />,
    );
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Send request' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('tells a non-member there is nothing to swap', async () => {
    const view = await render(
      <SwapRequestScreen
        group={group}
        viewerUserId="nobody"
        submitting={false}
        onSubmit={jest.fn()}
      />,
    );
    expect(view.getByText(/nothing to swap/i)).toBeTruthy();
  });
});
