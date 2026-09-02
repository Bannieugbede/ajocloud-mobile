import { router, useLocalSearchParams } from 'expo-router';

import type { PaymentIntent } from '@/api/endpoints/payments';
import { PaymentResultScreen } from '@/features/payments/payment-result-screen';
import { usePaymentStore } from '@/store/payment-store';

export default function PaymentResultRoute() {
  const { intent: serialized } = useLocalSearchParams<{ intent: string }>();
  const request = usePaymentStore((state) => state.request);
  const clear = usePaymentStore((state) => state.clear);

  let intent: PaymentIntent | null = null;
  try {
    intent = serialized ? (JSON.parse(serialized) as PaymentIntent) : null;
  } catch {
    intent = null;
  }

  if (!intent) {
    router.back();
    return null;
  }

  const finish = () => {
    const returnTo = request?.returnTo;
    clear();
    // replace: the payment flow is over, so it is unwound rather than left in
    // the stack behind the screen the user returns to.
    if (returnTo) router.replace(returnTo as never);
    else router.replace('/(tabs)/akawo/pools');
  };

  return (
    <PaymentResultScreen
      intent={intent}
      title={request?.title ?? 'your payment'}
      onDone={finish}
      onRetry={() => {
        // back: returns to the method screen, which still holds the intent, so
        // a failed attempt is retried rather than restarted.
        router.back();
      }}
    />
  );
}
