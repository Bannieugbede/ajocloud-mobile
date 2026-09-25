import { fireEvent, render } from '@testing-library/react-native';

import type { PaymentIntent } from '@/api/endpoints/payments';
import { PaymentMethodScreen } from '@/features/payments/payment-method-screen';
import { PaymentResultScreen } from '@/features/payments/payment-result-screen';

const intent: PaymentIntent = {
  id: 'intent-1',
  status: 'REQUIRES_CONFIRMATION',
  targetType: 'AKAWO_POOL_DUE',
  targetId: 'due-1',
  amountMinor: '500000',
  // A non-zero fee, so the screens are exercised against the banded model
  // landing rather than only against today's zero.
  feeMinor: '5000',
  totalMinor: '505000',
  currency: 'NGN',
  method: null,
  description: 'Akawo pool: Class of 2026 dues',
  expiresAt: '2026-09-02T00:15:00.000Z',
  settledAt: null,
  failureReason: null,
};

describe('PaymentMethodScreen', () => {
  const setup = (overrides: Partial<Parameters<typeof PaymentMethodScreen>[0]> = {}) =>
    render(
      <PaymentMethodScreen
        title="Class of 2026 dues"
        intent={intent}
        loading={false}
        error={false}
        onRetry={jest.fn()}
        onContinue={jest.fn()}
        {...overrides}
      />,
    );

  it('shows the fee separately from the amount rather than one opaque total', async () => {
    const view = await setup();
    expect(view.getByText('₦5,000.00')).toBeTruthy();
    expect(view.getByText('₦50.00')).toBeTruthy();
    // The total appears in the hero and again in the breakdown, deliberately:
    // the amount being charged is the one thing worth stating twice.
    expect(view.getAllByText('₦5,050.00').length).toBeGreaterThanOrEqual(2);
  });

  it('defaults to the wallet and continues with it', async () => {
    const onContinue = jest.fn();
    const view = await setup({ onContinue });
    fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledWith('WALLET');
  });

  it('offers only the methods the server says this payment accepts', async () => {
    const view = await setup({ intent: { ...intent, methods: ['WALLET'] } });
    expect(view.getByLabelText('Ajo Cloud wallet')).toBeTruthy();
    // A card payment for a due would settle as a deposit and leave the due
    // unpaid, so it is not offered at all.
    expect(view.queryByLabelText('Card')).toBeNull();
    expect(view.queryByLabelText('Bank transfer')).toBeNull();
  });

  it('never offers the wallet for a top-up, and defaults to the first method', async () => {
    const onContinue = jest.fn();
    const view = await setup({
      intent: { ...intent, targetType: 'WALLET_TOPUP', methods: ['TRANSFER', 'CARD'] },
      onContinue,
    });
    expect(view.queryByLabelText('Ajo Cloud wallet')).toBeNull();
    fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledWith('TRANSFER');
  });

  it('falls back to the wallet alone for a product when the server names no methods', async () => {
    // An older server: offering a card here would be offering a wrong settlement.
    const view = await setup();
    expect(view.getByLabelText('Ajo Cloud wallet')).toBeTruthy();
    expect(view.queryByLabelText('Card')).toBeNull();
  });

  describe('when the wallet cannot cover it', () => {
    const short = { walletAvailableMinor: '100000', intent: { ...intent, methods: ['WALLET'] } };

    it('says by how much, and will not continue', async () => {
      const onContinue = jest.fn();
      const view = await setup({ ...short, onContinue } as never);
      expect(view.getByText('Your wallet is ₦4,050.00 short')).toBeTruthy();
      fireEvent.press(view.getByRole('button', { name: 'Continue' }));
      expect(onContinue).not.toHaveBeenCalled();
    });

    it('offers to add the shortfall, so the payment is a step away rather than a dead end', async () => {
      const onTopUp = jest.fn();
      const view = await setup({ ...short, onTopUp } as never);
      fireEvent.press(view.getByRole('button', { name: 'Add money' }));
      expect(onTopUp).toHaveBeenCalledWith('405000');
    });
  });

  describe('paying part of what is owed', () => {
    const owed = {
      intent: { ...intent, feeMinor: '0', totalMinor: '500000', methods: ['WALLET'] },
      owedMinor: '500000',
    };

    it('is not offered for a payment that must be made in full', async () => {
      const view = await setup({ onChangeAmount: jest.fn() });
      expect(view.queryByRole('button', { name: 'Pay part' })).toBeNull();
    });

    it('asks for a new quote for the amount chosen', async () => {
      const onChangeAmount = jest.fn();
      const view = await setup({ ...owed, onChangeAmount } as never);
      fireEvent.press(view.getByRole('button', { name: 'Pay part' }));
      fireEvent.changeText(await view.findByTestId('payment-part-amount'), '1500');
      fireEvent.press(await view.findByRole('button', { name: 'Use this amount' }));
      expect(onChangeAmount).toHaveBeenCalledWith('150000');
    });

    it('refuses more than is owed, before asking the server', async () => {
      const onChangeAmount = jest.fn();
      const view = await setup({ ...owed, onChangeAmount } as never);
      fireEvent.press(view.getByRole('button', { name: 'Pay part' }));
      fireEvent.changeText(await view.findByTestId('payment-part-amount'), '6000');
      fireEvent.press(await view.findByRole('button', { name: 'Use this amount' }));
      expect(onChangeAmount).not.toHaveBeenCalled();
      expect(await view.findByText('That is more than the ₦5,000.00 still owed.')).toBeTruthy();
    });

    it('treats the whole amount as paying in full', async () => {
      const onChangeAmount = jest.fn();
      const view = await setup({ ...owed, onChangeAmount } as never);
      fireEvent.press(view.getByRole('button', { name: 'Pay part' }));
      fireEvent.changeText(await view.findByTestId('payment-part-amount'), '5000');
      fireEvent.press(await view.findByRole('button', { name: 'Use this amount' }));
      expect(onChangeAmount).toHaveBeenCalledWith(null);
    });

    it('says a part payment leaves the rest owed, and can go back to paying all', async () => {
      const onChangeAmount = jest.fn();
      const view = await setup({
        ...owed,
        intent: { ...owed.intent, amountMinor: '150000', totalMinor: '150000' },
        onChangeAmount,
      } as never);
      expect(view.getByText(/Paying ₦1,500\.00 now\. The rest stays owed\./)).toBeTruthy();
      fireEvent.press(view.getByRole('button', { name: 'Pay all' }));
      expect(onChangeAmount).toHaveBeenCalledWith(null);
    });
  });

  it('reports a failed start without implying money moved', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <PaymentMethodScreen
        title="Class of 2026 dues"
        loading={false}
        error
        onRetry={onRetry}
        onContinue={jest.fn()}
      />,
    );
    // The reason arrives as a toast; the retry still says it for a screen reader.
    const retry = view.getByRole('button', { name: /Could not start this payment\. Try again/ });
    expect(retry.props.accessibilityHint).toMatch(/Nothing has been charged/i);
    fireEvent.press(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('PaymentResultScreen', () => {
  const setup = (status: PaymentIntent['status'], extra: Partial<PaymentIntent> = {}) =>
    render(
      <PaymentResultScreen
        intent={{ ...intent, status, ...extra }}
        title="Class of 2026 dues"
        onDone={jest.fn()}
        onRetry={jest.fn()}
      />,
    );

  it('returns to the payment a completed top-up was for', async () => {
    const onResume = jest.fn();
    const view = await render(
      <PaymentResultScreen
        intent={{ ...intent, targetType: 'WALLET_TOPUP', status: 'SUCCEEDED' }}
        title="Add money"
        pausedFor="Class of 2026 dues"
        onDone={jest.fn()}
        onRetry={jest.fn()}
        onResume={onResume}
      />,
    );
    fireEvent.press(view.getByRole('button', { name: 'Continue to pay for Class of 2026 dues' }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('does not offer to continue until the top-up has actually arrived', async () => {
    const view = await render(
      <PaymentResultScreen
        intent={{ ...intent, targetType: 'WALLET_TOPUP', status: 'PROCESSING' }}
        title="Add money"
        pausedFor="Class of 2026 dues"
        onDone={jest.fn()}
        onRetry={jest.fn()}
        onResume={jest.fn()}
      />,
    );
    expect(view.queryByRole('button', { name: /Continue to pay/ })).toBeNull();
    expect(view.getByText(/finish paying for Class of 2026 dues/)).toBeTruthy();
  });

  it('confirms a completed payment', async () => {
    const view = await setup('SUCCEEDED');
    expect(view.getByText('Payment complete')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('treats a pending transfer as waiting, not as a failure', async () => {
    // A bank transfer can take minutes; calling that failed would be wrong.
    const view = await setup('PROCESSING', {
      transferInstructions: {
        accountNumber: '0123456789',
        bankName: 'Test Bank',
        accountName: 'Ajo Cloud',
        reference: 'PAY-ABC123',
        expiresAt: '2026-09-03T00:00:00.000Z',
      },
    });
    expect(view.getByText('Waiting for your payment')).toBeTruthy();
    expect(view.getByText('0123456789')).toBeTruthy();
    // The reference is how the backend matches an incoming credit back to this
    // payment; a transfer sent without it can arrive unattributable.
    expect(view.getByText('PAY-ABC123')).toBeTruthy();
  });

  it('shows the cancelled state without offering a retry', async () => {
    const view = await setup('CANCELLED');
    expect(view.getByText('Payment cancelled')).toBeTruthy();
    expect(view.getByText(/Nothing was charged/i)).toBeTruthy();
  });

  it('offers a retry on failure and says nothing was charged', async () => {
    const onRetry = jest.fn();
    const view = await render(
      <PaymentResultScreen
        intent={{ ...intent, status: 'FAILED' }}
        title="Class of 2026 dues"
        onDone={jest.fn()}
        onRetry={onRetry}
      />,
    );
    expect(view.getByText('Payment failed')).toBeTruthy();
    expect(view.getByText(/Nothing was charged/i)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the provider reason when there is one', async () => {
    const view = await setup('FAILED', { failureReason: 'Your card was declined.' });
    expect(view.getByText('Your card was declined.')).toBeTruthy();
  });
});
