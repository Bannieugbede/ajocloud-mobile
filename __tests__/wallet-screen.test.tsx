import { act, fireEvent, render } from '@testing-library/react-native';

import type { WalletSummary, WalletTransaction } from '@/api/endpoints/wallets';
import { WalletScreen } from '@/features/wallet/wallet-screen';

const summary: WalletSummary = {
  id: 'w1',
  currency: 'NGN',
  status: 'ACTIVE',
  availableMinor: '12500000',
  reservedMinor: '0',
};

function movement(id: string, description: string): WalletTransaction {
  return {
    id,
    direction: 'CREDIT',
    amountMinor: '5000000',
    currency: 'NGN',
    createdAt: '2026-07-15T10:32:00.000Z',
    transaction: {
      reference: `ref-${id}`,
      description,
      status: 'SUCCESSFUL',
      postedAt: '2026-07-15T10:32:00.000Z',
    },
  };
}

function setup(overrides: Partial<React.ComponentProps<typeof WalletScreen>> = {}) {
  return render(
    <WalletScreen
      summary={summary}
      movements={[]}
      loading={false}
      error={false}
      refreshing={false}
      onRefresh={jest.fn()}
      onRetry={jest.fn()}
      onFund={jest.fn()}
      onSend={jest.fn()}
      onWithdraw={jest.fn()}
      onOpenHistory={jest.fn()}
      {...overrides}
    />,
  );
}

it('leads with the spendable balance', async () => {
  const view = await setup();
  expect(view.getByText('AVAILABLE BALANCE')).toBeTruthy();
  expect(view.getByLabelText('₦125,000.00')).toBeTruthy();
});

it('accounts for money held against a withdrawal', async () => {
  // Without this the available balance appears to drop with the money nowhere,
  // which reads as a wallet that has lost track of someone's funds.
  const view = await setup({ summary: { ...summary, reservedMinor: '2500000' } });
  expect(view.getByText(/₦25,000\.00 on its way out/)).toBeTruthy();
  expect(view.getByText(/held while a withdrawal settles/)).toBeTruthy();
});

it('says nothing about reserved funds when none are held', async () => {
  const view = await setup();
  expect(view.queryByText(/on its way out/)).toBeNull();
});

it('offers the three things you can do with a wallet', async () => {
  const handlers = { onFund: jest.fn(), onSend: jest.fn(), onWithdraw: jest.fn() };
  const view = await setup(handlers);

  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Add money' })));
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Send' })));
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Withdraw' })));

  for (const handler of Object.values(handlers)) expect(handler).toHaveBeenCalledTimes(1);
});

it('shows only the last few movements, with a way to the rest', async () => {
  // This screen answers "what have I got?". The full history answers "where did
  // it go?", and printing all of it here would make the balance scroll away.
  const onOpenHistory = jest.fn();
  const view = await setup({
    movements: Array.from({ length: 9 }, (_, index) => movement(`m${index}`, `Payment ${index}`)),
    onOpenHistory,
  });

  expect(view.getByText('Payment 4')).toBeTruthy();
  expect(view.queryByText('Payment 5')).toBeNull();

  await act(async () => fireEvent.press(view.getByRole('button', { name: 'See all' })));
  expect(onOpenHistory).toHaveBeenCalledTimes(1);
});

it('explains an empty wallet rather than showing a bare list', async () => {
  const view = await setup();
  expect(view.getByText('No activity yet')).toBeTruthy();
  // No "See all" with nothing to see, and no second Add money button: the
  // action bar above already carries it, and offering it twice is not a choice.
  expect(view.queryByRole('button', { name: 'See all' })).toBeNull();
  expect(view.getAllByRole('button', { name: 'Add money' })).toHaveLength(1);
});

it('offers a retry rather than a blank screen when the balance will not load', async () => {
  const onRetry = jest.fn();
  const view = await setup({ summary: undefined, error: true, onRetry });
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Try again' })));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('never shows a stale balance while loading', async () => {
  // A wallet that renders zero, or the previous figure, while it refreshes is
  // worse than one that says it is still loading.
  const view = await setup({ loading: true });
  expect(view.getByTestId('wallet-skeleton')).toBeTruthy();
  expect(view.queryByText('AVAILABLE BALANCE')).toBeNull();
});
