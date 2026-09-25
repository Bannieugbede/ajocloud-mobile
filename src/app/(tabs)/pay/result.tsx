import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { getPaymentIntent, type PaymentIntent } from '@/api/endpoints/payments';
import { queryKeysAfterPayment } from '@/features/payments/payment-targets';
import { PaymentResultScreen } from '@/features/payments/payment-result-screen';
import { usePaymentStore } from '@/store/payment-store';

/** How often a payment waiting on the bank is checked again. */
const PROCESSING_POLL_MS = 5_000;

function parseIntent(serialized: string | undefined): PaymentIntent | null {
  try {
    return serialized ? (JSON.parse(serialized) as PaymentIntent) : null;
  } catch {
    return null;
  }
}

export default function PaymentResultRoute() {
  const { intent: serialized } = useLocalSearchParams<{ intent: string }>();
  const request = usePaymentStore((state) => state.request);
  const resume = usePaymentStore((state) => state.resume);
  const clear = usePaymentStore((state) => state.clear);
  const resumePaused = usePaymentStore((state) => state.resumePaused);
  const queryClient = useQueryClient();
  const initial = parseIntent(serialized);

  // A transfer or card payment is PROCESSING until the provider's webhook
  // lands, which can take minutes. Checked again until it settles, so the
  // member sees it complete here rather than having to go and look.
  // A separate key from the confirm screen's, which holds this intent as it
  // was before payment and would otherwise be shown instead.
  const live = useQuery({
    queryKey: ['payment-result', initial?.id],
    queryFn: () => getPaymentIntent(initial?.id ?? ''),
    enabled: Boolean(initial),
    ...(initial ? { initialData: initial } : {}),
    refetchInterval: (query) =>
      query.state.data?.status === 'PROCESSING' ? PROCESSING_POLL_MS : false,
    // A failed check is not news: the payment is unchanged, and the next check
    // will try again. A toast every five seconds on a bad connection would be.
    meta: { toast: false },
  });
  const intent = live.data ?? initial;

  // A payment that settles while this screen is open changed balances the
  // confirm step could not have refreshed, because they had not moved yet.
  const settledWhileWatching = useRef(false);
  useEffect(() => {
    if (intent?.status !== 'SUCCEEDED' || !initial || initial.status === 'SUCCEEDED') return;
    if (settledWhileWatching.current || !request) return;
    settledWhileWatching.current = true;
    for (const queryKey of queryKeysAfterPayment(request.target)) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }, [intent?.status, initial, request, queryClient]);

  useEffect(() => {
    if (!intent) router.back();
  }, [intent]);

  if (!intent) return null;

  const finish = () => {
    const returnTo = request?.returnTo;
    clear();
    // replace: the payment flow is over, so it is unwound rather than left in
    // the stack behind the screen the member returns to. Home is the fallback
    // because it is the one screen that always exists.
    if (returnTo) router.replace(returnTo as never);
    else router.replace('/(tabs)/home');
  };

  return (
    <PaymentResultScreen
      intent={intent}
      title={request?.title ?? 'your payment'}
      {...(resume ? { pausedFor: resume.title } : {})}
      onDone={finish}
      onRetry={() => {
        // back: returns to the payment screen, which still holds the quote, so
        // a failed attempt is retried rather than restarted.
        router.back();
      }}
      onResume={() => {
        resumePaused();
        // Back to the payment screen already in the stack, which restarts for
        // the resumed payment because the flow it is keyed by has changed.
        router.dismissTo('/(tabs)/pay');
      }}
    />
  );
}
