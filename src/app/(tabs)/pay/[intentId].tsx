import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';

import {
  confirmPaymentIntent,
  getPaymentIntent,
  type PaymentMethod,
} from '@/api/endpoints/payments';
import { PaymentConfirmScreen } from '@/features/payments/payment-confirm-screen';
import { usePaymentStore } from '@/store/payment-store';
import type { AppError } from '@/types/errors';

export default function PaymentConfirmRoute() {
  const { intentId, method } = useLocalSearchParams<{
    intentId: string;
    method: PaymentMethod;
  }>();
  const request = usePaymentStore((state) => state.request);
  const queryClient = useQueryClient();

  const idempotencyKey = useRef(`confirm-${intentId}`).current;

  // A query rather than a mutation: this is a read, and it must not fire during
  // render the way a conditional mutate() would.
  const intent = useQuery({
    queryKey: ['payment-intent', intentId],
    queryFn: () => getPaymentIntent(intentId),
    enabled: Boolean(intentId),
  });

  const confirm = useMutation({
    mutationFn: (transactionPin: string) =>
      confirmPaymentIntent(intentId, { method, transactionPin }, idempotencyKey),
    onSuccess: (result) => {
      // The payment changed the thing being paid for, so its screens refetch.
      void queryClient.invalidateQueries({ queryKey: ['akawo-pool'] });
      void queryClient.invalidateQueries({ queryKey: ['akawo-pools'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      // replace: the PIN prompt must not remain behind a completed payment,
      // where a back gesture would invite paying twice.
      router.replace({
        pathname: '/(tabs)/pay/result',
        params: { intent: JSON.stringify(result) },
      });
    },
  });

  // The amount is restated here rather than carried through navigation, so a
  // tampered param cannot change what the user is shown they are paying.
  if (!intent.data || !request) return null;

  return (
    <PaymentConfirmScreen
      title={request.title}
      intent={intent.data}
      method={method}
      submitting={confirm.isPending}
      error={confirm.error as AppError | null}
      onConfirm={(pin) => confirm.mutate(pin)}
    />
  );
}
