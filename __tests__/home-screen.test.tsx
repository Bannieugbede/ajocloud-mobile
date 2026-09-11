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
    unreadCount: 0,
    dark: false,
    onToggleTheme: jest.fn(),
    onOpenNotifications: jest.fn(),
    onToggleBalance: jest.fn(),
    onRefresh: jest.fn(),
    onRetry: jest.fn(),
    onOpenAjo: jest.fn(),
    onOpenGroup: jest.fn(),
    onOpenUpcoming: jest.fn(),
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
  expect(view.getByText('Savings')).toBeTruthy();
  expect(view.getByText('Rewards')).toBeTruthy();
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
  const onOpenUpcoming = jest.fn();
  const view = await render(<HomeScreen {...props({ onOpenUpcoming })} />);

  await act(async () =>
    fireEvent.press(view.getByLabelText(/Pay Eko Savings Circle, ₦25,000\.00, Due soon/)),
  );
  expect(onOpenUpcoming).toHaveBeenCalledWith(contribution);
});

it('hands a payout row to the same handler, marked as incoming', async () => {
  // Where each kind of row goes is the route's decision, not the screen's, so
  // the screen reports which row was tapped and nothing more.
  const onOpenUpcoming = jest.fn();
  const payout: UpcomingItem = {
    ...contribution,
    id: 'payout:p1',
    kind: 'PAYOUT',
    urgency: 'SCHEDULED',
  };
  const view = await render(<HomeScreen {...props({ upcoming: [payout], onOpenUpcoming })} />);

  await act(async () => fireEvent.press(view.getByLabelText(/Payout Eko Savings Circle/)));
  expect(onOpenUpcoming).toHaveBeenCalledWith(payout);
  expect(view.getByText('Incoming')).toBeTruthy();
});

describe('header', () => {
  it('offers notifications, and shows an unread mark only when there are some', async () => {
    const quiet = await render(<HomeScreen {...props({ unreadCount: 0 })} />);
    expect(quiet.getByLabelText('Notifications')).toBeTruthy();

    // The count is in the label, not only in a coloured dot a screen reader
    // cannot see.
    const busy = await render(<HomeScreen {...props({ unreadCount: 3 })} />);
    expect(busy.getByLabelText('Notifications, 3 unread')).toBeTruthy();
  });

  it('opens notifications', async () => {
    const onOpenNotifications = jest.fn();
    const view = await render(<HomeScreen {...props({ onOpenNotifications })} />);
    await act(async () => fireEvent.press(view.getByLabelText('Notifications')));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('names what the theme toggle will do, not what the theme is', async () => {
    const light = await render(<HomeScreen {...props({ dark: false })} />);
    expect(light.getByLabelText('Switch to dark mode')).toBeTruthy();

    const dark = await render(<HomeScreen {...props({ dark: true })} />);
    expect(dark.getByLabelText('Switch to light mode')).toBeTruthy();
  });

  it('toggles the theme', async () => {
    const onToggleTheme = jest.fn();
    const view = await render(<HomeScreen {...props({ onToggleTheme })} />);
    await act(async () => fireEvent.press(view.getByLabelText('Switch to dark mode')));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});

it('shows an Akawo pool due alongside Ajo obligations', async () => {
  // Both are money owed by a date; splitting them by product would hide one
  // behind a tab the member has not opened.
  const poolDue: UpcomingItem = {
    id: 'pool-due:d1',
    kind: 'POOL_DUE',
    groupId: 'pool-1',
    groupName: 'Faculty Week Contribution',
    product: 'Akawo',
    amountMinor: '300000',
    currency: 'NGN',
    dueAt: new Date(Date.now() + 10 * 86_400_000).toISOString(),
    urgency: 'SCHEDULED',
  };
  const view = await render(<HomeScreen {...props({ upcoming: [poolDue] })} />);

  expect(view.getByText(/Faculty Week Contribution/)).toBeTruthy();
  expect(view.getByText('Pending')).toBeTruthy();
  expect(view.getByText(/Akawo/)).toBeTruthy();
});

it('states urgency in words, not only in colour', async () => {
  const view = await render(<HomeScreen {...props()} />);
  expect(view.getByText('Due soon')).toBeTruthy();
});

describe('hero and quick actions', () => {
  it('names the wallet and what the headline figure means', async () => {
    // The figure is the spendable balance, not everything the member owns, so
    // the card says which of the two it is rather than leaving it to be guessed.
    const view = await render(<HomeScreen {...props()} />);

    expect(view.getByText('Main Wallet')).toBeTruthy();
    expect(view.getByText('Available to spend')).toBeTruthy();
  });

  it('leaves the hero one figure, with savings and rewards below it', async () => {
    // The hero states the spendable balance and nothing else. Savings and
    // rewards are still the member's money, so they moved down the page rather
    // than off it, and they still mask with the wallet toggle.
    const view = await render(<HomeScreen {...props()} />);

    expect(view.getByTestId('home-wallet-balance')).toBeTruthy();
    expect(view.getByTestId('home-tile-savings')).toBeTruthy();
    expect(view.getByTestId('home-tile-rewards')).toBeTruthy();

    const hidden = await render(<HomeScreen {...props({ balanceVisible: false })} />);
    expect(hidden.getAllByLabelText('Balance hidden')).toHaveLength(3);
  });

  it('keeps the actions under their own heading, outside the balance card', async () => {
    const view = await render(<HomeScreen {...props()} />);

    expect(view.getByRole('header', { name: 'Quick Actions' })).toBeTruthy();
    expect(view.getByLabelText('Send')).toBeTruthy();
    expect(view.getByLabelText('Withdraw')).toBeTruthy();
    expect(view.getByLabelText('Bills')).toBeTruthy();
  });
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
