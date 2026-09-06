import { act, fireEvent, render } from '@testing-library/react-native';

import type { BillCategory, BillPayment } from '@/api/endpoints/bill-payments';
import { BillsHomeScreen } from '@/features/bills/bills-home-screen';
import { FundWalletScreen } from '@/features/wallet/fund-wallet-screen';

const categories: BillCategory[] = [
  { id: 'c-power', providerCode: 'ELEC', name: 'Electricity', expiresAt: '2027-01-01T00:00:00Z' },
  { id: 'c-tv', providerCode: 'TV', name: 'Cable TV', expiresAt: '2027-01-01T00:00:00Z' },
];

const payment = (overrides: Partial<BillPayment> = {}): BillPayment => ({
  id: 'p-1',
  internalReference: 'ref-1',
  providerReference: null,
  customerReferenceMasked: '••7841',
  verifiedCustomerName: null,
  amountMinor: '2450000',
  feeMinor: '0',
  totalDebitMinor: '2450000',
  currency: 'NGN',
  status: 'SUCCESSFUL',
  reconciliationState: 'MATCHED',
  failureReason: null,
  createdAt: '2026-07-10T09:00:00.000Z',
  completedAt: '2026-07-10T09:01:00.000Z',
  biller: { id: 'b-dstv', name: 'DSTV', category: { id: 'c-tv', name: 'Cable TV' } },
  ...overrides,
});

describe('the bills home screen', () => {
  const setup = async (props: Partial<Parameters<typeof BillsHomeScreen>[0]> = {}) =>
    await render(
      <BillsHomeScreen
        categories={categories}
        loading={false}
        error={false}
        onRetry={jest.fn()}
        onOpenCategory={jest.fn()}
        onOpenPayment={jest.fn()}
        onQuickPay={jest.fn()}
        {...props}
      />,
    );

  it('names what each category tile pays for', async () => {
    const view = await setup();
    expect(view.getByLabelText('Pay Electricity')).toBeTruthy();
    expect(view.getByLabelText('Pay Cable TV')).toBeTruthy();
  });

  it('opens a category', async () => {
    const onOpenCategory = jest.fn();
    const view = await setup({ onOpenCategory });
    await act(async () => fireEvent.press(view.getByLabelText('Pay Electricity')));
    expect(onOpenCategory).toHaveBeenCalledWith(expect.objectContaining({ id: 'c-power' }));
  });

  it('offers a bill the payer has settled before', async () => {
    // There is no beneficiaries endpoint, so "saved" means "paid before and
    // settled" — which is a better definition anyway, since nobody curates a
    // list of their own bills.
    const view = await setup({ recent: [payment()] });
    // The same biller appears under Recent too, so the saved row is found by
    // what it offers to do rather than by the name alone.
    expect(view.getByLabelText(/Pay DSTV again/)).toBeTruthy();
    expect(view.getByText('Quick Pay')).toBeTruthy();
  });

  it('repeats a saved bill with the biller and amount it was last paid at', async () => {
    const onQuickPay = jest.fn();
    const view = await setup({ recent: [payment()], onQuickPay });
    await act(async () => fireEvent.press(view.getByText('Quick Pay')));
    expect(onQuickPay).toHaveBeenCalledWith(
      expect.objectContaining({ billerId: 'b-dstv', amountMinor: '2450000' }),
    );
  });

  it('never offers to repeat a payment that failed', async () => {
    // Offering it again would suggest the last one worked.
    const view = await setup({ recent: [payment({ status: 'FAILED' })] });
    expect(view.queryByText('Quick Pay')).toBeNull();
  });

  it('still lists a failed payment under recent, because it happened', async () => {
    const view = await setup({ recent: [payment({ status: 'FAILED' })] });
    expect(view.getByText('failed')).toBeTruthy();
  });

  it('signs a bill payment as leaving the wallet', async () => {
    const view = await setup({ recent: [payment()] });
    expect(view.getByText('−₦24,500.00')).toBeTruthy();
  });

  it('opens a past payment’s receipt', async () => {
    const onOpenPayment = jest.fn();
    const view = await setup({ recent: [payment()], onOpenPayment });
    await act(async () => fireEvent.press(view.getByText('Jul 10 · Cable TV')));
    expect(onOpenPayment).toHaveBeenCalledWith('p-1');
  });
});

describe('funding the wallet', () => {
  const setup = async (props: Partial<Parameters<typeof FundWalletScreen>[0]> = {}) =>
    await render(
      <FundWalletScreen
        availableMinor="84732050"
        currency="NGN"
        submitting={false}
        onContinue={jest.fn()}
        {...props}
      />,
    );

  it('shows what is already in the wallet', async () => {
    const view = await setup();
    expect(view.getByLabelText('Current balance ₦847,320.50')).toBeTruthy();
  });

  it('says the balance is unavailable rather than showing zero', async () => {
    // A balance that failed to load and a balance of nothing are different,
    // and confusing them is how someone concludes their money has gone.
    const view = await setup({ availableMinor: null });
    expect(view.getByText('Unavailable')).toBeTruthy();
  });

  it('fills the amount from a quick-select tap', async () => {
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    await act(async () => fireEvent.press(view.getByLabelText('Add ₦10,000.00')));
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).toHaveBeenCalledWith('1000000');
  });

  it('will not continue on an amount below what the server accepts', async () => {
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    await act(async () => fireEvent.changeText(view.getByLabelText('Or enter amount (₦)'), '100'));
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('names the minimum rather than only refusing', async () => {
    const view = await setup();
    expect(view.getByText(/smallest amount you can add is ₦500/)).toBeTruthy();
  });

  it('warns that a deposit carries a fee before the payer commits', async () => {
    // Finding out on the confirmation screen reads as a surprise charge.
    const view = await setup();
    expect(view.getByText(/deposit fee applies/)).toBeTruthy();
  });

  it('sends a typed amount in minor units', async () => {
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Or enter amount (₦)'), '7500.50'),
    );
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).toHaveBeenCalledWith('750050');
  });
});
