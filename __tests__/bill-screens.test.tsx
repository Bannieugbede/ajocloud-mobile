import { act, fireEvent, render } from '@testing-library/react-native';

import type { BillBiller, BillPayment, BillProduct } from '@/api/endpoints/bill-payments';
import { BillReceiptScreen } from '@/features/bills/bill-receipt-screen';
import { BillerListScreen } from '@/features/bills/biller-list-screen';
import { PayBillScreen } from '@/features/bills/pay-bill-screen';

const fixedProduct: BillProduct = {
  id: 'p1',
  providerCode: 'DEV_MTN_500',
  name: 'MTN ₦500 Airtime',
  minimumMinor: null,
  maximumMinor: null,
  fixedAmountMinor: '50000',
  currency: 'NGN',
};

const openProduct: BillProduct = {
  ...fixedProduct,
  id: 'p2',
  name: 'Airtime top-up',
  fixedAmountMinor: null,
};

const biller: BillBiller = {
  id: 'b1',
  providerCode: 'DEV_MTN',
  name: 'MTN Airtime',
  products: [fixedProduct],
};

const validation = {
  id: 'v1',
  valid: true,
  customerReferenceMasked: '*******4567',
  verifiedCustomerName: 'Test Customer',
  expiresAt: '2099-01-01T00:00:00.000Z',
};

const payment: BillPayment = {
  id: 'bp1',
  internalReference: 'BILL-abc',
  providerReference: 'mock-abc',
  customerReferenceMasked: '*******4567',
  verifiedCustomerName: 'Test Customer',
  amountMinor: '50000',
  feeMinor: '0',
  totalDebitMinor: '50000',
  currency: 'NGN',
  status: 'SUCCESSFUL',
  reconciliationState: 'NOT_REQUIRED',
  failureReason: null,
  createdAt: '2026-09-02T00:00:00.000Z',
  completedAt: '2026-09-02T00:00:01.000Z',
  receipt: { receiptNumber: 'RCP-1', issuedAt: '2026-09-02T00:00:01.000Z' },
};

describe('BillerListScreen', () => {
  const twoProducts: BillBiller = { ...biller, products: [fixedProduct, openProduct] };

  const setup = async (props: Partial<Parameters<typeof BillerListScreen>[0]> = {}) =>
    await render(
      <BillerListScreen
        categoryName="Electricity"
        billers={[biller]}
        loading={false}
        error={false}
        onRetry={jest.fn()}
        onContinue={jest.fn()}
        {...props}
      />,
    );

  it('lists the providers as a single choice', async () => {
    const view = await setup();
    expect(view.getByLabelText('MTN Airtime')).toBeTruthy();
  });

  it('marks the chosen provider as selected, not merely coloured', async () => {
    const view = await setup();
    const row = view.getByLabelText('MTN Airtime');
    await act(async () => fireEvent.press(row));
    expect(row.props.accessibilityState.selected).toBe(true);
  });

  it('names the reference the way the payer’s own bill does', async () => {
    // "Reference" is correct and useless; someone checking they are paying the
    // right account needs the words printed on their bill.
    const view = await setup();
    expect(view.getByLabelText('Meter number')).toBeTruthy();
  });

  it('shows a fixed product at its exact price rather than asking for an amount', async () => {
    const view = await setup();
    await act(async () => fireEvent.press(view.getByLabelText('MTN Airtime')));
    expect(view.getByText('₦500.00')).toBeTruthy();
    expect(view.queryByLabelText('Amount (₦)')).toBeNull();
  });

  it('asks for an amount when the product does not fix one', async () => {
    const view = await setup({ billers: [{ ...biller, products: [openProduct] }] });
    await act(async () => fireEvent.press(view.getByLabelText('MTN Airtime')));
    expect(view.getByLabelText('Amount (₦)')).toBeTruthy();
  });

  it('offers the packages when a biller has more than one', async () => {
    const view = await setup({ billers: [twoProducts] });
    await act(async () => fireEvent.press(view.getByLabelText('MTN Airtime')));
    expect(view.getByLabelText('Airtime top-up. Any amount')).toBeTruthy();
  });

  it('will not continue before a provider and a reference are given', async () => {
    // Disabled rather than erroring: nothing is wrong yet, the payer simply has
    // not finished.
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('carries the provider, reference and amount to the confirmation', async () => {
    const onContinue = jest.fn();
    const view = await setup({ billers: [{ ...biller, products: [openProduct] }], onContinue });

    await act(async () => fireEvent.press(view.getByLabelText('MTN Airtime')));
    await act(async () => fireEvent.changeText(view.getByLabelText('Meter number'), '04223344556'));
    await act(async () => fireEvent.changeText(view.getByLabelText('Amount (₦)'), '15000'));
    await act(async () => fireEvent.press(view.getByText('Continue')));

    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ customerReference: '04223344556', amountMinor: '1500000' }),
    );
  });

  it('preselects the provider and amount when a saved bill is repeated', async () => {
    const view = await setup({
      billers: [{ ...biller, products: [openProduct] }],
      initialBillerId: 'b1',
      initialAmountMinor: '1500000',
    });
    expect(view.getByLabelText('MTN Airtime').props.accessibilityState.selected).toBe(true);
    expect(view.getByDisplayValue('15000')).toBeTruthy();
  });

  it('still asks for the reference when repeating, since it is only ever masked', async () => {
    // The history holds "••2293", which is not a meter number. Asking again is
    // also what stops a repeat quietly paying the wrong meter.
    const view = await setup({ initialBillerId: 'b1', initialAmountMinor: '1500000' });
    expect(view.getByLabelText('Meter number').props.value).toBe('');
  });
});

describe('PayBillScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <PayBillScreen
        biller={biller}
        product={fixedProduct}
        categoryName="Airtime"
        validation={null}
        walletAvailableMinor="10000000"
        validating={false}
        paying={false}
        onValidate={jest.fn()}
        onChangeReference={jest.fn()}
        onPay={jest.fn()}
        {...overrides}
      />,
    );

  it('names the reference field for the category rather than saying "reference"', async () => {
    const view = await setup();
    expect(view.getByLabelText('Phone number')).toBeTruthy();
  });

  it('does not ask for an amount before the number is checked', async () => {
    // Paying quotes a validation bound to the exact reference, so asking for
    // the amount first would routinely produce a stale pair.
    const view = await setup();
    expect(view.queryByRole('button', { name: 'Pay bill' })).toBeNull();
  });

  it('will not check a number that is obviously too short', async () => {
    const onValidate = jest.fn();
    const view = await setup({ onValidate });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('Phone number'), '12');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Check this number' }));
    });
    expect(onValidate).not.toHaveBeenCalled();
  });

  it('shows the confirmed account name once checked', async () => {
    const view = await setup({ validation });
    expect(view.getByText('Test Customer')).toBeTruthy();
  });

  it('shows a fixed amount rather than asking for one', async () => {
    const view = await setup({ validation });
    expect(view.getByText(/fixed amount set by MTN Airtime/i)).toBeTruthy();
    expect(view.queryByLabelText('Amount')).toBeNull();
  });

  it('asks for an amount when the product does not fix one', async () => {
    const view = await setup({ validation, product: openProduct });
    expect(view.getByLabelText('Amount')).toBeTruthy();
  });

  it('clears a confirmation when the number is edited', async () => {
    // Editing makes the validation stale; the backend would refuse the pair.
    const onChangeReference = jest.fn();
    const view = await setup({ validation, onChangeReference });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('Phone number'), '0803123456');
    });
    expect(onChangeReference).toHaveBeenCalled();
  });

  it('refuses to pay more than the wallet holds, and says the balance', async () => {
    const onPay = jest.fn();
    const view = await setup({ validation, walletAvailableMinor: '10000' });
    expect(view.getByText(/₦100\.00 available/)).toBeTruthy();
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay bill' }));
    });
    expect(onPay).not.toHaveBeenCalled();
  });

  it('pays the fixed amount, ignoring anything typed', async () => {
    const onPay = jest.fn();
    const view = await setup({ validation, onPay });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('Phone number'), '08031234567');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay bill' }));
    });
    expect(onPay).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: '50000', customerReference: '08031234567' }),
    );
  });
});

describe('BillReceiptScreen', () => {
  const setup = async (overrides: Partial<BillPayment> = {}) =>
    await render(
      <BillReceiptScreen
        payment={{ ...payment, ...overrides }}
        onDone={jest.fn()}
        onRetry={jest.fn()}
      />,
    );

  it('confirms a completed payment', async () => {
    const view = await setup();
    expect(view.getByText('Payment complete')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('shows the fee separately even when it is zero', async () => {
    // So a fee that starts being charged is not a surprise the payer has to
    // work out from their balance.
    const view = await setup();
    expect(view.getByText('Fee')).toBeTruthy();
  });

  it('offers a retry on failure and says nothing was charged', async () => {
    const view = await setup({ status: 'FAILED', failureReason: null });
    expect(view.getByText('Payment failed')).toBeTruthy();
    expect(view.getByText(/was not charged/i)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('claims neither success nor failure while reconciliation is pending', async () => {
    // The wallet was debited and the provider's result is unknown; both a
    // success and a failure message would be wrong.
    const view = await setup({ status: 'RECONCILIATION_REQUIRED' });
    expect(view.getByText(/checking this payment/i)).toBeTruthy();
    expect(view.queryByText('Payment complete')).toBeNull();
    expect(view.queryByText('Payment failed')).toBeNull();
  });

  it('treats a processing payment as in flight, not as a failure', async () => {
    const view = await setup({ status: 'PROCESSING' });
    expect(view.getByText('Payment in progress')).toBeTruthy();
  });
});
