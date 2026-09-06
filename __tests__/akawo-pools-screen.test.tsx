import { act, fireEvent, render } from '@testing-library/react-native';

import type { JoinedPool } from '@/api/endpoints/akawo-pools';
import { PoolsListScreen, type PoolsListScreenProps } from '@/features/akawo/pools-list-screen';

function joined(id: string, name: string, status: 'PENDING' | 'PAID'): JoinedPool {
  return {
    membershipId: `m-${id}`,
    pool: {
      id,
      name,
      purpose: 'Faculty week events',
      amountMinor: '300000',
      currency: 'NGN',
      status: 'OPEN',
      referenceLabel: 'Matric number',
      dueAt: '2026-09-15T00:00:00Z',
      closedAt: null,
      createdAt: '2026-08-01T00:00:00Z',
    },
    due: { id: `d-${id}`, amountMinor: '300000', status, paidAt: null },
    memberCount: 3,
    paidCount: 2,
    collectedMinor: '600000',
    expectedMinor: '900000',
    progressBps: 6666,
  };
}

function props(overrides: Partial<PoolsListScreenProps> = {}): PoolsListScreenProps {
  return {
    organised: [],
    joined: [],
    loading: false,
    error: false,
    refreshing: false,
    onRefresh: jest.fn(),
    onRetry: jest.fn(),
    onCreate: jest.fn(),
    onJoin: jest.fn(),
    onOpenOrganised: jest.fn(),
    onOpenJoined: jest.fn(),
    onOpenGoals: jest.fn(),
    ...overrides,
  };
}

it('calls out a payment that is still due', async () => {
  const view = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Faculty Week', 'PENDING')] })} />,
  );
  expect(view.getByText('Payment Due')).toBeTruthy();
  expect(view.getByText('Pay ₦3,000.00')).toBeTruthy();
});

it('opens the pool from the due banner', async () => {
  const onOpenJoined = jest.fn();
  const view = await render(
    <PoolsListScreen
      {...props({ joined: [joined('p1', 'Faculty Week', 'PENDING')], onOpenJoined })}
    />,
  );
  await act(async () => fireEvent.press(view.getByLabelText('Pay ₦3,000.00 for Faculty Week')));
  expect(onOpenJoined).toHaveBeenCalledWith('p1');
});

it('shows no banner when everything is settled', async () => {
  // A banner with nothing behind it trains people to ignore the real one.
  const view = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Departmental Dues', 'PAID')] })} />,
  );
  expect(view.queryByText('Payment Due')).toBeNull();
});

it('counts multiple outstanding payments', async () => {
  const view = await render(
    <PoolsListScreen
      {...props({
        joined: [joined('p1', 'Faculty Week', 'PENDING'), joined('p2', 'Dept Dues', 'PENDING')],
      })}
    />,
  );
  expect(view.getByText('2 Payments Due')).toBeTruthy();
});

it('invites a join code only once there is something to see', async () => {
  const empty = await render(<PoolsListScreen {...props()} />);
  expect(empty.queryByText('Have a pool code?')).toBeNull();

  const withPools = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Dept Dues', 'PAID')] })} />,
  );
  expect(withPools.getByText('Have a pool code?')).toBeTruthy();
});

it('shows a joined pool as the group is doing, not only what is owed', async () => {
  // A member deciding whether to pay wants to know the group is paying too.
  // Before the joined list carried totals this card could only show the due.
  const view = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Faculty Week', 'PENDING')] })} />,
  );
  expect(view.getByText('2/3 paid · ₦6,000.00 collected')).toBeTruthy();
  expect(view.getByText('Members')).toBeTruthy();
});

it('names who is collecting on a joined pool', async () => {
  // Whom a member is paying is what makes a collection trustworthy.
  const entry = joined('p1', 'Faculty Week', 'PENDING');
  const view = await render(
    <PoolsListScreen
      {...props({
        joined: [{ ...entry, pool: { ...entry.pool, organiserName: 'Dr. Bode Adewale' } }],
      })}
    />,
  );
  expect(view.getByText('Dr. Bode Adewale')).toBeTruthy();
});

it('abbreviates a due date on a card but keeps the day', async () => {
  const view = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Faculty Week', 'PAID')] })} />,
  );
  // "Sep 15", not "Sep 15, 2026": three facts sit side by side and the year is
  // almost never the one that decides anything.
  expect(view.getByText(/^\w+ 15$/)).toBeTruthy();
});

it('opens the pool from its card', async () => {
  const onOpenJoined = jest.fn();
  const view = await render(
    <PoolsListScreen
      {...props({ joined: [joined('p1', 'Faculty Week', 'PAID')], onOpenJoined })}
    />,
  );
  await act(async () => fireEvent.press(view.getByLabelText('Open Faculty Week, ₦3,000.00, Paid')));
  expect(onOpenJoined).toHaveBeenCalledWith('p1');
});

it('draws no progress bar for a pool nobody has joined', async () => {
  // A bar over zero members is a bar that can only ever read empty, which looks
  // like a stalled collection rather than a new one.
  const entry = joined('p1', 'New pool', 'PENDING');
  const view = await render(
    <PoolsListScreen
      {...props({ joined: [{ ...entry, memberCount: 0, paidCount: 0, collectedMinor: '0' }] })}
    />,
  );
  expect(view.queryByLabelText('New pool collection')).toBeNull();
});

it('renders against a server that does not send pool totals yet', async () => {
  // The deployed backend predates the totals on the joined list. Reading a
  // missing count crashed the whole tab, so the card degrades to what it knows
  // instead: the type saying a field is there does not make it arrive.
  const legacy = {
    membershipId: 'm1',
    pool: {
      id: 'p1',
      name: 'Faculty Week',
      purpose: null,
      amountMinor: '300000',
      currency: 'NGN',
      status: 'OPEN' as const,
      referenceLabel: 'Matric number',
      dueAt: null,
      closedAt: null,
      createdAt: '2026-08-01T00:00:00Z',
    },
    due: { id: 'd1', amountMinor: '300000', status: 'PENDING' as const, paidAt: null },
  } as unknown as JoinedPool;

  const view = await render(<PoolsListScreen {...props({ joined: [legacy] })} />);
  expect(view.getAllByText('Faculty Week').length).toBeGreaterThan(0);
  expect(view.getByText('0/0 paid · ₦0.00 collected')).toBeTruthy();
});
