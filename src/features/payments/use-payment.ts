import { router } from 'expo-router';
import { useCallback } from 'react';

import { type PaymentRequest, usePaymentStore } from '@/store/payment-store';

/**
 * The one way into a payment, for every product.
 *
 * A product says what is owed and where to come back to; the shared flow does
 * the rest — the quote, the method, the PIN, the result, and a top-up if the
 * wallet is short:
 *
 *   const payment = usePayment();
 *   payment.start({
 *     target: { kind: 'AKAWO_POOL_DUE', poolId, dueId },
 *     title: pool.name,
 *     returnTo: `/(tabs)/akawo/pools/${poolId}`,
 *   });
 */
export function usePayment() {
  const begin = usePaymentStore((state) => state.start);

  const start = useCallback(
    (request: PaymentRequest) => {
      begin(request);
      // push: the product's screen stays underneath, so abandoning the payment
      // returns to it rather than dropping the member somewhere else.
      router.push('/(tabs)/pay');
    },
    [begin],
  );

  return { start };
}
