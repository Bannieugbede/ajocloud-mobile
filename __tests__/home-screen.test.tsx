import { act, fireEvent, render } from '@testing-library/react-native';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { HomeScreen, type HomeScreenProps } from '@/features/home/home-screen';
import type { UpcomingItem } from '@/features/home/home-data';

const user = {
  id: 'user',
  email: 'ayo@example.com',
  phone: '+2348012345678',
  status: 'ACTIVE' as const,
  profile: {
    firstName: 'Ayo',
    lastName: 'Cloud',
    avatarUrl: null,
    timezone: 'Africa/Lagos',
    locale: 'en-NG',
  },
};

const group: AjoGroupSummary = {
  id: 'group-1',
  name: 'Eko Savings Circle',
  status: 'ACTIVE',
  contributionFrequency: 'MONTHLY',
  contributionMode: 'FIXED',
  baseContributionMinor: '2500000',
  currency: 'NGN',
  maxSlots: 12,
  maxMembers: 12,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  _count: { slots: 4, members: 4 },
};

const contribution: UpcomingItem = {
  id: 'contribution:s1',
  kind: 'CONTRIBUTION',
  groupId: 'group-1',
  groupName: 'Eko Savings Circle',
  amountMinor: '2500000',
  currency: 'NGN',
  dueAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  scheduleId: 's1',
  urgency: 'DUE_SOON',
};

function props(overrides: Partial<HomeScreenProps> = {}): HomeScreenProps {
  return {
    user,
    groups: [group],
    upcoming: [contribution],
    quickPay: [],
    availableMinor: '84732050',
    savingsMinor: '23450000',
    rewardsMinor: '0',
    currency: 'NGN',
    loading: false,
    refreshing: false,
    error: false,
    balanceVisible: true,
    onToggleBalance: jest.fn(),
    onRefresh: jest.fn(),
    onRetry: jest.fn(),
    onOpenAjo: jest.fn(),
    onOpenGroup: jest.fn(),
    onPayContribution: jest.fn(),
    onOpenBills: jest.fn(),
    onOpenCategory: jest.fn(),
    onQuickPay: jest.fn(),
    onSend: jest.fn(),
    onWithdraw: jest.fn(),
    ...overrides,
  };
}

it('shows the balance, savings and rewards the API returned', async () => {
  const view = await render(<HomeScreen {...props()} />);

  expect(view.getByText('Ayo Cloud')).toBeTruthy();
  expect(view.getByText('₦847,320.50')).toBeTruthy();
  expect(view.getByText('₦234,500.00')).toBeTruthy();
  expect(view.getByText('SAVINGS')).toBeTruthy();
  expect(view.getByText('REWARDS')).toBeTruthy();
});

it('masks every balance at once when hidden', async () => {
  const view = await render(<HomeScreen {...props({ balanceVisible: false })} />);

  // The main balance and both tiles: hiding the wallet must not leave savings
  // or rewards legible over the shoulder of whoever is watching.
  expect(view.queryByText('₦847,320.50')).toBeNull();
  expect(view.queryByText('₦234,500.00')).toBeNull();
  expect(view.getAllByLabelText('Balance hidden')).toHaveLength(3);
});

it('says the balance is unavailable rather than showing zero', async () => {
  // A wallet that could not be read is not a wallet with no money in it.
  const view = await render(<HomeScreen {...props({ availableMinor: undefined })} />);
  expect(view.getByText('Balance unavailable')).toBeTruthy();
});

it('pays a contribution from the upcoming row', async () => {
  const onPayContribution = jest.fn();
  const view = await render(<HomeScreen {...props({ onPayContribution })} />);

  await act(async () =>
    fireEvent.press(view.getByLabelText(/Pay Eko Savings Circle, ₦25,000\.00, Due soon/)),
  );
  expect(onPayContribution).toHaveBeenCalledWith(contribution);
});

it('opens the group for an incoming payout rather than asking for money', async () => {
  const onOpenGroup = jest.fn();
  const onPayContribution = jest.fn();
  const payout: UpcomingItem = {
    ...contribution,
    id: 'payout:p1',
    kind: 'PAYOUT',
    urgency: 'SCHEDULED',
  };
  const view = await render(
    <HomeScreen {...props({ upcoming: [payout], onOpenGroup, onPayContribution })} />,
  );

  await act(async () => fireEvent.press(view.getByLabelText(/Payout Eko Savings Circle/)));
  expect(onOpenGroup).toHaveBeenCalledWith('group-1');
  expect(onPayContribution).not.toHaveBeenCalled();
});

it('states urgency in words, not only in colour', async () => {
  const view = await render(<HomeScreen {...props()} />);
  expect(view.getByText('Due soon')).toBeTruthy();
});

it('locks Fund with a reason while funding is unavailable', async () => {
  const view = await render(<HomeScreen {...props()} />);

  const fund = view.getByLabelText(/^Fund, unavailable/);
  expect(fund).toBeTruthy();
  // Send and Withdraw have working APIs, so they are not locked.
  expect(view.getByLabelText('Send')).toBeTruthy();
  expect(view.getByLabelText('Withdraw')).toBeTruthy();
});

it('enables Fund once funding is available', async () => {
  const onFund = jest.fn();
  const view = await render(<HomeScreen {...props({ onFund })} />);

  await act(async () => fireEvent.press(view.getByLabelText('Fund')));
  expect(onFund).toHaveBeenCalledTimes(1);
});

it('offers a recently paid biller by name', async () => {
  const onQuickPay = jest.fn();
  const view = await render(
    <HomeScreen
      {...props({
        quickPay: [
          {
            billerName: 'DSTV',
            categoryName: 'Cable TV',
            customerReferenceMasked: '****7841',
            amountMinor: '2450000',
            currency: 'NGN',
            paymentId: 'pay-1',
          },
        ],
        onQuickPay,
      })}
    />,
  );

  expect(view.getByText('DSTV')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByLabelText(/Pay DSTV again/)));
  expect(onQuickPay).toHaveBeenCalledTimes(1);
});

it('says nothing is due rather than showing an empty list', async () => {
  const view = await render(<HomeScreen {...props({ upcoming: [] })} />);
  expect(view.getByText(/Nothing is due/)).toBeTruthy();
});

it('keeps showing what it has when a refresh fails', async () => {
  const onRetry = jest.fn();
  const view = await render(<HomeScreen {...props({ error: true, onRetry })} />);

  // Stale data beats a blank screen, provided the staleness is stated.
  expect(view.getByText('Some information could not be refreshed')).toBeTruthy();
  expect(view.getByText('₦847,320.50')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Try again' })));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('toggles balance visibility', async () => {
  const onToggleBalance = jest.fn();
  const view = await render(<HomeScreen {...props({ onToggleBalance })} />);

  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Hide wallet balance' })));
  expect(onToggleBalance).toHaveBeenCalledTimes(1);
});

it('opens the Ajo tab from the section action', async () => {
  const onOpenAjo = jest.fn();
  const view = await render(<HomeScreen {...props({ onOpenAjo })} />);

  await act(async () => fireEvent.press(view.getByLabelText('See all My Ajo Groups')));
  expect(onOpenAjo).toHaveBeenCalledTimes(1);
});

it('opens a bill category from its shortcut', async () => {
  const onOpenCategory = jest.fn();
  const view = await render(<HomeScreen {...props({ onOpenCategory })} />);

  await act(async () => fireEvent.press(view.getByLabelText('Pay Electricity bill')));
  expect(onOpenCategory).toHaveBeenCalledWith('Electricity');
});
