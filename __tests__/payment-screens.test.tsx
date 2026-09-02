import { fireEvent, render } from '@testing-library/react-native';

import type { PaymentIntent } from '@/api/endpoints/payments';
import { PaymentMethodScreen } from '@/features/payments/payment-method-screen';
import { PaymentResultScreen } from '@/features/payments/payment-result-screen';

const intent: PaymentIntent = {
  id: 'intent-1',
  amountMinor: '500000',
  feeMinor: '5000',
  totalMinor: '505000',
  currency: 'NGN',
  status: 'REQUIRES_METHOD',
  transferInstructions: null,
  checkoutUrl: null,
  failureReason: null,
  createdAt: '2026-09-02T00:00:00.000Z',
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

  it('says how much is available when the wallet cannot cover the total', async () => {
    const view = await setup({ walletAvailableMinor: '100000' });
    expect(view.getByText(/Not enough balance/)).toBeTruthy();
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
    expect(view.getByText(/Nothing has been charged/i)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));
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
        expiresAt: '2026-09-03T00:00:00.000Z',
      },
    });
    expect(view.getByText('Waiting for your payment')).toBeTruthy();
    expect(view.getByText('0123456789')).toBeTruthy();
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
