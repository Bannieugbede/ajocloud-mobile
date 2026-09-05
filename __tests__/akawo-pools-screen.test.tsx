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
    ...overrides,
  };
}

it('calls out a payment that is still due', async () => {
  const view = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Faculty Week', 'PENDING')] })} />,
  );
  expect(view.getByText('Payment due')).toBeTruthy();
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
  expect(view.queryByText('Payment due')).toBeNull();
});

it('counts multiple outstanding payments', async () => {
  const view = await render(
    <PoolsListScreen
      {...props({
        joined: [joined('p1', 'Faculty Week', 'PENDING'), joined('p2', 'Dept Dues', 'PENDING')],
      })}
    />,
  );
  expect(view.getByText('2 payments due')).toBeTruthy();
});

it('invites a join code only once there is something to see', async () => {
  const empty = await render(<PoolsListScreen {...props()} />);
  expect(empty.queryByText('Have a pool code?')).toBeNull();

  const withPools = await render(
    <PoolsListScreen {...props({ joined: [joined('p1', 'Dept Dues', 'PAID')] })} />,
  );
  expect(withPools.getByText('Have a pool code?')).toBeTruthy();
});
