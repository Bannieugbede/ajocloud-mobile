import { act, fireEvent, render } from '@testing-library/react-native';

import type { BillBiller, BillPayment, BillProduct } from '@/api/endpoints/bill-payments';
import { BillReceiptScreen } from '@/features/bills/bill-receipt-screen';
import { BillerListScreen } from '@/features/bills/biller-list-screen';
import { PayBillScreen } from '@/features/bills/pay-bill-screen';

const fixedProduct: BillProduct = {
  id: 'p1',
  providerCode: 'MTN-DATA-1GB-1D',
  name: '1GB',
  minimumMinor: null,
  maximumMinor: null,
  fixedAmountMinor: '50000',
  currency: 'NGN',
  validity: '1 day',
};

const secondPlan: BillProduct = {
  ...fixedProduct,
  id: 'p3',
  providerCode: 'MTN-DATA-2GB-30D',
  name: '2GB',
  fixedAmountMinor: '150000',
  validity: '30 days',
};

const openProduct: BillProduct = {
  ...fixedProduct,
  id: 'p2',
  providerCode: 'MTN-VTU',
  name: 'Airtime top-up',
  minimumMinor: '5000',
  maximumMinor: '5000000',
  fixedAmountMinor: null,
  validity: null,
};

const biller: BillBiller = {
  id: 'b1',
  providerCode: 'MTN-DATA',
  name: 'MTN Data',
  referenceKind: 'phone',
  referenceLabel: 'Phone number',
  products: [fixedProduct],
};

const airtime: BillBiller = { ...biller, id: 'b3', name: 'MTN', products: [openProduct] };

const prepaid: BillProduct = {
  ...openProduct,
  id: 'p4',
  providerCode: 'EKEDC-PREPAID',
  name: 'Prepaid meter',
  minimumMinor: '100000',
  maximumMinor: '50000000',
};

const meterBiller: BillBiller = {
  id: 'b2',
  providerCode: 'EKEDC',
  name: 'Eko Electric (EKEDC)',
  referenceKind: 'meter',
  referenceLabel: 'Meter number',
  products: [prepaid, { ...prepaid, id: 'p5', name: 'Postpaid account' }],
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
  const setup = async (props: Partial<Parameters<typeof BillerListScreen>[0]> = {}) =>
    await render(
      <BillerListScreen
        categoryName="Internet"
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
    expect(view.getByLabelText('MTN Data')).toBeTruthy();
  });

  it('marks the chosen provider as selected, not merely coloured', async () => {
    const view = await setup();
    const tile = view.getByLabelText('MTN Data');
    await act(async () => fireEvent.press(tile));
    expect(view.getByLabelText('MTN Data').props.accessibilityState.selected).toBe(true);
  });

  it('names the reference the way the biller does', async () => {
    // "Reference" is correct and useless; someone checking they are paying the
    // right account needs the words printed on their bill.
    const view = await setup({ categoryName: 'Electricity', billers: [meterBiller] });
    await act(async () => fireEvent.press(view.getByLabelText('Eko Electric (EKEDC)')));
    expect(view.getByLabelText('Meter number')).toBeTruthy();
  });

  it('shows a single package at its exact price rather than asking for an amount', async () => {
    const view = await setup();
    await act(async () => fireEvent.press(view.getByLabelText('MTN Data')));
    expect(view.getByText('₦500.00')).toBeTruthy();
    expect(view.queryByLabelText('Amount (₦)')).toBeNull();
  });

  it('lists data plans with their price and how long they last', async () => {
    const view = await setup({ billers: [{ ...biller, products: [fixedProduct, secondPlan] }] });
    await act(async () => fireEvent.press(view.getByLabelText('MTN Data')));
    expect(view.getByLabelText('2GB. 30 days. ₦1,500.00')).toBeTruthy();
  });

  it('switches between prepaid and postpaid rather than listing them as packages', async () => {
    const view = await setup({ categoryName: 'Electricity', billers: [meterBiller] });
    await act(async () => fireEvent.press(view.getByLabelText('Eko Electric (EKEDC)')));
    expect(view.getByText('Prepaid meter')).toBeTruthy();
    expect(view.getByText('Postpaid account')).toBeTruthy();
    expect(view.queryByText('PACKAGE')).toBeNull();
  });

  it('offers quick airtime amounts that fill the amount', async () => {
    const view = await setup({ categoryName: 'Airtime', billers: [airtime] });
    await act(async () => fireEvent.press(view.getByLabelText('MTN')));
    await act(async () => fireEvent.press(view.getByText('₦500.00')));
    expect(view.getByLabelText('Amount (₦)').props.value).toBe('500');
  });

  it('will not continue before a provider and a reference are given', async () => {
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('explains a phone number that is too short', async () => {
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    await act(async () => fireEvent.press(view.getByLabelText('MTN Data')));
    await act(async () => fireEvent.changeText(view.getByLabelText('Phone number'), '0803123'));
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).not.toHaveBeenCalled();
    expect(view.getByText(/11-digit phone number/)).toBeTruthy();
  });

  it('sends a phone number in the one form the backend stores', async () => {
    const onContinue = jest.fn();
    const view = await setup({ categoryName: 'Airtime', billers: [airtime], onContinue });
    await act(async () => fireEvent.press(view.getByLabelText('MTN')));
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Phone number'), '+234 803 123 4567'),
    );
    await act(async () => fireEvent.changeText(view.getByLabelText('Amount (₦)'), '1000'));
    await act(async () => fireEvent.press(view.getByText('Continue')));
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ customerReference: '08031234567', amountMinor: '100000' }),
    );
  });

  it('carries the meter, type and amount to the confirmation', async () => {
    const onContinue = jest.fn();
    const view = await setup({
      categoryName: 'Electricity',
      billers: [meterBiller],
      onContinue,
    });

    await act(async () => fireEvent.press(view.getByLabelText('Eko Electric (EKEDC)')));
    await act(async () => fireEvent.press(view.getByText('Prepaid meter')));
    await act(async () => fireEvent.changeText(view.getByLabelText('Meter number'), '04223344556'));
    await act(async () => fireEvent.changeText(view.getByLabelText('Amount (₦)'), '15000'));
    await act(async () => fireEvent.press(view.getByText('Continue')));

    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        customerReference: '04223344556',
        amountMinor: '1500000',
        product: expect.objectContaining({ id: 'p4' }),
      }),
    );
  });

  it('preselects the provider and amount when a saved bill is repeated', async () => {
    const view = await setup({
      categoryName: 'Airtime',
      billers: [airtime],
      initialBillerId: 'b3',
      initialAmountMinor: '150000',
    });
    expect(view.getByLabelText('MTN').props.accessibilityState.selected).toBe(true);
    expect(view.getByDisplayValue('1500')).toBeTruthy();
  });

  it('still asks for the reference when repeating, since it is only ever masked', async () => {
    // The history holds "••2293", which is not a meter number. Asking again is
    // also what stops a repeat quietly paying the wrong meter.
    const view = await setup({
      categoryName: 'Electricity',
      billers: [meterBiller],
      initialBillerId: 'b2',
      initialAmountMinor: '1500000',
    });
    expect(view.getByLabelText('Meter number').props.value).toBe('');
  });
});

describe('PayBillScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <PayBillScreen
        biller={biller}
        product={fixedProduct}
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

  it('names the reference field the way the biller does', async () => {
    const view = await setup();
    expect(view.getByLabelText('Phone number')).toBeTruthy();
  });

  it('checks a number carried from the previous step without a second tap', async () => {
    const onValidate = jest.fn();
    await setup({ onValidate, initialReference: '08031234567' });
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onValidate).toHaveBeenCalledWith('08031234567');
  });

  it('says how long a package lasts', async () => {
    const view = await setup();
    expect(view.getByText('Lasts 1 day')).toBeTruthy();
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
    expect(view.getByText(/fixed amount set by MTN Data/i)).toBeTruthy();
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
