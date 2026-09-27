import { act, fireEvent, render } from '@testing-library/react-native';

import type { BillBiller, BillPayment, BillProduct } from '@/api/endpoints/bill-payments';
import { BillReceiptScreen } from '@/features/bills/bill-receipt-screen';
import { BillCategoryScreen } from '@/features/bills/bill-forms';
import { ProviderPickerScreen } from '@/features/bills/provider-picker-screen';
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

const airtel: BillBiller = {
  ...airtime,
  id: 'b4',
  providerCode: 'AIRTEL',
  name: 'Airtel',
  products: [{ ...openProduct, id: 'p6', providerCode: 'AIRTEL-VTU' }],
};

const dstv: BillBiller = {
  id: 'b5',
  providerCode: 'DSTV',
  name: 'DStv',
  referenceKind: 'smartcard',
  referenceLabel: 'Smartcard number',
  products: [
    {
      ...fixedProduct,
      id: 'p7',
      providerCode: 'DSTV-PADI',
      name: 'Padi',
      fixedAmountMinor: '440000',
      validity: '1 month',
    },
  ],
};

type FormProps = Parameters<typeof BillCategoryScreen>[0];

const renderForm = async (props: Partial<FormProps> & Pick<FormProps, 'kind' | 'billers'>) =>
  await render(
    <BillCategoryScreen
      biller={props.billers?.[0] ?? null}
      providerChosen={false}
      loading={false}
      error={false}
      onRetry={jest.fn()}
      onSelectBiller={jest.fn()}
      onOpenProviders={jest.fn()}
      onContinue={jest.fn()}
      {...props}
    />,
  );

describe('Airtime', () => {
  it('picks the network from the number as it is typed', async () => {
    const onSelectBiller = jest.fn();
    const view = await renderForm({ kind: 'airtime', billers: [airtime, airtel], onSelectBiller });
    await act(async () => fireEvent.changeText(view.getByLabelText('Phone number'), '08021234567'));
    expect(onSelectBiller).toHaveBeenCalledWith('b4');
  });

  it('leaves a network the payer chose alone, since numbers can be ported', async () => {
    const onSelectBiller = jest.fn();
    const view = await renderForm({
      kind: 'airtime',
      billers: [airtime, airtel],
      providerChosen: true,
      onSelectBiller,
    });
    await act(async () => fireEvent.changeText(view.getByLabelText('Phone number'), '08021234567'));
    expect(onSelectBiller).not.toHaveBeenCalled();
  });

  it('opens the network list from the badge', async () => {
    const onOpenProviders = jest.fn();
    const view = await renderForm({ kind: 'airtime', billers: [airtime], onOpenProviders });
    await act(async () => fireEvent.press(view.getByTestId('bill-network-button')));
    expect(onOpenProviders).toHaveBeenCalled();
  });

  it('buys a top-up tile for a valid number in one tap', async () => {
    const onContinue = jest.fn();
    const view = await renderForm({ kind: 'airtime', billers: [airtime], onContinue });
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Phone number'), '+234 803 123 4567'),
    );
    await act(async () => fireEvent.press(view.getByLabelText('₦500')));
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ customerReference: '08031234567', amountMinor: '50000' }),
    );
  });

  it('explains a short number instead of continuing', async () => {
    const onContinue = jest.fn();
    const view = await renderForm({ kind: 'airtime', billers: [airtime], onContinue });
    await act(async () => fireEvent.changeText(view.getByLabelText('Phone number'), '0803123'));
    await act(async () => fireEvent.press(view.getByLabelText('₦500')));
    expect(onContinue).not.toHaveBeenCalled();
    expect(view.getByText(/11-digit phone number/)).toBeTruthy();
  });

  it('pays a typed amount', async () => {
    const onContinue = jest.fn();
    const view = await renderForm({ kind: 'airtime', billers: [airtime], onContinue });
    await act(async () => fireEvent.changeText(view.getByLabelText('Phone number'), '08031234567'));
    await act(async () => fireEvent.changeText(view.getByLabelText('Amount (₦)'), '750'));
    await act(async () => fireEvent.press(view.getByText('Pay')));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ amountMinor: '75000' }));
  });

  it('prefills the amount of a repeated bill', async () => {
    const view = await renderForm({
      kind: 'airtime',
      billers: [airtime],
      initialAmountMinor: '150000',
    });
    expect(view.getByDisplayValue('1500')).toBeTruthy();
  });
});

describe('Internet', () => {
  const data: BillBiller = { ...biller, products: [fixedProduct, secondPlan] };

  it('lists plans with size, validity and price', async () => {
    const view = await renderForm({ kind: 'internet', billers: [data] });
    expect(view.getByLabelText('2GB, 30 days, ₦1,500.00')).toBeTruthy();
  });

  it('groups plans by how long they last', async () => {
    const view = await renderForm({ kind: 'internet', billers: [data] });
    await act(async () => fireEvent.press(view.getByText('Monthly')));
    expect(view.queryByLabelText('1GB, 1 day, ₦500.00')).toBeNull();
    expect(view.getByLabelText('2GB, 30 days, ₦1,500.00')).toBeTruthy();
  });

  it('buys a plan at its price once the number is valid', async () => {
    const onContinue = jest.fn();
    const view = await renderForm({ kind: 'internet', billers: [data], onContinue });
    await act(async () => fireEvent.changeText(view.getByLabelText('Phone number'), '08031234567'));
    await act(async () => fireEvent.press(view.getByLabelText('2GB, 30 days, ₦1,500.00')));
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: '150000',
        product: expect.objectContaining({ id: 'p3' }),
      }),
    );
  });
});

describe('Electricity', () => {
  it('shows the provider and opens the full list from it', async () => {
    const onOpenProviders = jest.fn();
    const view = await renderForm({ kind: 'electricity', billers: [meterBiller], onOpenProviders });
    await act(async () => fireEvent.press(view.getByTestId('bill-provider-field')));
    expect(onOpenProviders).toHaveBeenCalled();
  });

  it('offers prepaid and postpaid as a choice, prepaid first', async () => {
    const view = await renderForm({ kind: 'electricity', billers: [meterBiller] });
    expect(view.getByLabelText('Prepaid').props.accessibilityState.selected).toBe(true);
    await act(async () => fireEvent.press(view.getByLabelText('Postpaid')));
    expect(view.getByLabelText('Postpaid').props.accessibilityState.selected).toBe(true);
  });

  it('only offers amounts the DisCo accepts', async () => {
    const view = await renderForm({ kind: 'electricity', billers: [meterBiller] });
    expect(view.getByLabelText('₦1,000')).toBeTruthy();
    expect(view.queryByLabelText('₦500')).toBeNull();
  });

  it('carries the meter, type and amount to the confirmation', async () => {
    const onContinue = jest.fn();
    const view = await renderForm({ kind: 'electricity', billers: [meterBiller], onContinue });
    await act(async () => fireEvent.press(view.getByLabelText('Postpaid')));
    await act(async () => fireEvent.changeText(view.getByLabelText('Meter number'), '04223344556'));
    await act(async () => fireEvent.press(view.getByLabelText('₦5,000')));
    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        customerReference: '04223344556',
        amountMinor: '500000',
        product: expect.objectContaining({ id: 'p5' }),
      }),
    );
  });
});

describe('Cable TV', () => {
  it('lists packages with how long they last and their price', async () => {
    const view = await renderForm({ kind: 'cable', billers: [dstv] });
    expect(view.getByLabelText('DStv Padi, 1 month, ₦4,400.00')).toBeTruthy();
  });

  it('asks for the smartcard before a package can be bought', async () => {
    const onContinue = jest.fn();
    const view = await renderForm({ kind: 'cable', billers: [dstv], onContinue });
    await act(async () => fireEvent.press(view.getByLabelText('DStv Padi, 1 month, ₦4,400.00')));
    expect(onContinue).not.toHaveBeenCalled();
    await act(async () =>
      fireEvent.changeText(view.getByLabelText('Smartcard number'), '7020147841'),
    );
    await act(async () => fireEvent.press(view.getByLabelText('DStv Padi, 1 month, ₦4,400.00')));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ amountMinor: '440000' }));
  });
});

describe('ProviderPickerScreen', () => {
  const setup = async (onSelect = jest.fn()) =>
    await render(
      <ProviderPickerScreen
        kind="electricity"
        billers={[
          meterBiller,
          { ...meterBiller, id: 'b9', providerCode: 'IBEDC', name: 'Ibadan Electric (IBEDC)' },
        ]}
        selectedId="b2"
        loading={false}
        error={false}
        onRetry={jest.fn()}
        onSelect={onSelect}
      />,
    );

  it('marks the current provider', async () => {
    const view = await setup();
    expect(view.getByLabelText('Eko Electric (EKEDC)').props.accessibilityState.selected).toBe(
      true,
    );
  });

  it('narrows the list as the payer searches', async () => {
    const view = await setup();
    await act(async () => fireEvent.changeText(view.getByLabelText('Search providers'), 'ibadan'));
    expect(view.queryByLabelText('Eko Electric (EKEDC)')).toBeNull();
    expect(view.getByLabelText('Ibadan Electric (IBEDC)')).toBeTruthy();
  });

  it('returns the chosen provider', async () => {
    const onSelect = jest.fn();
    const view = await setup(onSelect);
    await act(async () => fireEvent.press(view.getByLabelText('Ibadan Electric (IBEDC)')));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'b9' }));
  });
});

describe('PayBillScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <PayBillScreen
        kind="internet"
        biller={biller}
        product={fixedProduct}
        customerReference="08031234567"
        amountMinor="50000"
        validation={null}
        walletAvailableMinor="10000000"
        validating={false}
        paying={false}
        onValidate={jest.fn()}
        onPay={jest.fn()}
        onEdit={jest.fn()}
        {...overrides}
      />,
    );

  it('checks the number with the provider as soon as it opens', async () => {
    const onValidate = jest.fn();
    await setup({ onValidate });
    expect(onValidate).toHaveBeenCalledTimes(1);
    expect(onValidate).toHaveBeenCalledWith('08031234567');
  });

  it('will not pay before the provider has recognised the number', async () => {
    const onPay = jest.fn();
    const view = await setup({ onPay });
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Pay ₦500.00' })));
    expect(onPay).not.toHaveBeenCalled();
  });

  it('shows who is being paid, the package and how long it lasts', async () => {
    const view = await setup({ validation });
    expect(view.getByText('Test Customer')).toBeTruthy();
    expect(view.getByText('Lasts 1 day')).toBeTruthy();
    expect(view.getByLabelText('Phone number: 08031234567')).toBeTruthy();
  });

  it('pays the confirmed amount', async () => {
    const onPay = jest.fn();
    const view = await setup({ validation, onPay });
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Pay ₦500.00' })));
    expect(onPay).toHaveBeenCalledWith({ customerReference: '08031234567', amountMinor: '50000' });
  });

  it('says so, and offers another check, when the number is not recognised', async () => {
    const view = await setup({
      validationError: { kind: 'validation', message: 'MTN Data did not recognise this number.' },
    });
    expect(view.getByText('MTN Data did not recognise this number.')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Check again' })).toBeTruthy();
  });

  it('refuses to pay more than the wallet holds', async () => {
    const onPay = jest.fn();
    const view = await setup({ validation, walletAvailableMinor: '10000', onPay });
    expect(view.getByText(/does not have enough/)).toBeTruthy();
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Pay ₦500.00' })));
    expect(onPay).not.toHaveBeenCalled();
  });

  it('goes back to change the details rather than editing here', async () => {
    const onEdit = jest.fn();
    const view = await setup({ onEdit });
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Change details' })));
    expect(onEdit).toHaveBeenCalled();
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
