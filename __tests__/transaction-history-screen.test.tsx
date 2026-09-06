import { act, fireEvent, render } from '@testing-library/react-native';

import type { WalletTransaction } from '@/api/endpoints/wallets';
import { TransactionHistoryScreen } from '@/features/wallet/transaction-history-screen';

function movement(
  id: string,
  direction: 'DEBIT' | 'CREDIT',
  amountMinor: string,
  description: string,
  status = 'SUCCESSFUL',
): WalletTransaction {
  return {
    id,
    direction,
    amountMinor,
    currency: 'NGN',
    createdAt: '2026-07-15T10:32:00.000Z',
    transaction: {
      reference: `ref-${id}`,
      description,
      status,
      postedAt: '2026-07-15T10:32:00.000Z',
    },
  };
}

const history = [
  movement('a', 'CREDIT', '5000000', 'Wallet Funded'),
  movement('b', 'DEBIT', '2500000', 'Eko Savings Circle'),
  movement('c', 'CREDIT', '30000000', 'Ajo Payout'),
];

function setup(movements: WalletTransaction[] | undefined = history, overrides = {}) {
  return render(
    <TransactionHistoryScreen
      movements={movements}
      currency="NGN"
      loading={false}
      error={false}
      refreshing={false}
      onRefresh={jest.fn()}
      onRetry={jest.fn()}
      {...overrides}
    />,
  );
}

it('leads with what has come in and gone out', async () => {
  const view = await setup();
  expect(view.getByLabelText('total in, ₦350,000.00')).toBeTruthy();
  expect(view.getByLabelText('total out, ₦25,000.00')).toBeTruthy();
});

it('signs each movement so its direction is readable without colour', async () => {
  const view = await setup();
  expect(view.getByText('+₦50,000.00')).toBeTruthy();
  expect(view.getByText('−₦25,000.00')).toBeTruthy();
});

it('filters to money in and back again', async () => {
  const view = await setup();
  expect(view.getByText('Eko Savings Circle')).toBeTruthy();

  await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Money In' })));
  expect(view.queryByText('Eko Savings Circle')).toBeNull();
  expect(view.getByText('Wallet Funded')).toBeTruthy();

  await act(async () => fireEvent.press(view.getByRole('tab', { name: 'All' })));
  expect(view.getByText('Eko Savings Circle')).toBeTruthy();
});

it('keeps the totals describing the account, not the current filter', async () => {
  // The totals are the account's position. Recomputing them per filter would
  // make "Money In" show an out total of zero, which is not true of the wallet.
  const view = await setup();
  await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Money In' })));
  expect(view.getByLabelText('total out, ₦25,000.00')).toBeTruthy();
});

it('leaves an unsettled movement out of the totals but still lists it', async () => {
  const view = await setup([
    movement('a', 'CREDIT', '5000000', 'Wallet Funded'),
    movement('p', 'CREDIT', '9900000', 'Bank Transfer', 'PENDING'),
  ]);
  expect(view.getByLabelText('total in, ₦50,000.00')).toBeTruthy();
  expect(view.getByText('Bank Transfer')).toBeTruthy();
  expect(view.getByText('Pending')).toBeTruthy();
});

it('explains an empty filter differently from an empty history', async () => {
  const empty = await setup([]);
  expect(empty.getByText('No transactions yet')).toBeTruthy();

  const view = await setup([movement('a', 'CREDIT', '5000000', 'Wallet Funded')]);
  await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Money Out' })));
  expect(view.getByText('Nothing to show here')).toBeTruthy();
});

it('offers a retry when the history could not be loaded', async () => {
  const onRetry = jest.fn();
  const view = await setup(undefined, { error: true, onRetry });
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Try again' })));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('reads a row as one element rather than four fragments', async () => {
  const view = await setup([movement('a', 'CREDIT', '5000000', 'Wallet Funded')]);
  expect(view.getByLabelText(/^Wallet Funded, \+₦50,000\.00, Successful, /)).toBeTruthy();
});
