import { type PaymentRequest, usePaymentStore } from './payment-store';

const due: PaymentRequest = {
  target: { kind: 'AKAWO_POOL_DUE', poolId: 'p1', dueId: 'd1' },
  title: 'Class of 2026 dues',
  returnTo: '/(tabs)/akawo/pools/p1',
};

describe('payment store', () => {
  beforeEach(() => usePaymentStore.getState().clear());

  it('starts every payment as a new flow', () => {
    usePaymentStore.getState().start(due);
    const first = usePaymentStore.getState().flowId;
    usePaymentStore.getState().start(due);
    // The payment screen is keyed by this, so nothing — least of all an
    // idempotency key — carries over from one payment into the next.
    expect(usePaymentStore.getState().flowId).not.toBe(first);
  });

  it('pauses a payment for a top-up that returns to the same place', () => {
    usePaymentStore.getState().start(due);
    usePaymentStore.getState().startTopUp('405000');

    const { request, resume } = usePaymentStore.getState();
    expect(request?.target).toEqual({ kind: 'WALLET_TOPUP', amountMinor: '405000' });
    expect(request?.returnTo).toBe(due.returnTo);
    expect(request?.subtitle).toBe('So you can pay for Class of 2026 dues');
    expect(resume).toEqual(due);
  });

  it('resumes the paused payment as a fresh flow', () => {
    usePaymentStore.getState().start(due);
    usePaymentStore.getState().startTopUp('405000');
    const topUpFlow = usePaymentStore.getState().flowId;

    usePaymentStore.getState().resumePaused();

    const { request, resume, flowId } = usePaymentStore.getState();
    expect(request).toEqual(due);
    expect(resume).toBeNull();
    expect(flowId).not.toBe(topUpFlow);
  });

  it('forgets a paused payment when a new one starts', () => {
    usePaymentStore.getState().start(due);
    usePaymentStore.getState().startTopUp('405000');
    usePaymentStore.getState().start({ ...due, title: 'Something else' });
    expect(usePaymentStore.getState().resume).toBeNull();
  });

  it('does nothing when asked to top up with no payment in progress', () => {
    usePaymentStore.getState().startTopUp('405000');
    expect(usePaymentStore.getState().request).toBeNull();
  });
});
