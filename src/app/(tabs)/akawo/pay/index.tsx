import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  createPaymentIntent,
  getWalletBalance,
  type PaymentMethod,
} from '@/api/endpoints/payments';
import { PaymentMethodScreen } from '@/features/payments/payment-method-screen';
import { usePaymentStore } from '@/store/payment-store';

export default function PaymentMethodRoute() {
  const request = usePaymentStore((state) => state.request);

  // One key per mounted flow, so a retried tap reuses the same intent rather
  // than creating a second payment for the same due. Generated in a lazy state
  // initialiser: calling Date.now or Math.random during render is impure and
  // would produce a different key on a re-render.
  const [idempotencyKey] = useState(
    () => `payment-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const intent = useMutation({
    mutationFn: () => {
      if (!request) throw new Error('No payment was started');
      return createPaymentIntent(request.target, idempotencyKey);
    },
  });

  const wallet = useQuery({ queryKey: ['wallet-balance'], queryFn: getWalletBalance });

  useEffect(() => {
    if (request && !intent.data && !intent.isPending) intent.mutate();
    // Runs once per flow: the mutation object identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  useEffect(() => {
    // Arriving without a request means the flow was entered directly, e.g. by a
    // deep link. There is nothing to pay for, so return rather than show an
    // empty payment screen.
    if (!request) router.back();
  }, [request]);

  if (!request) return null;

  return (
    <PaymentMethodScreen
      title={request.title}
      {...(request.subtitle ? { subtitle: request.subtitle } : {})}
      {...(intent.data ? { intent: intent.data } : {})}
      {...(wallet.data ? { walletAvailableMinor: wallet.data.availableMinor } : {})}
      loading={intent.isPending}
      error={intent.isError}
      onRetry={() => intent.mutate()}
      onContinue={(method: PaymentMethod) => {
        if (!intent.data) return;
        // push: the method screen stays underneath so the user can change their
        // mind at the PIN prompt without restarting the payment.
        router.push({
          pathname: '/(tabs)/akawo/pay/[intentId]',
          params: { intentId: intent.data.id, method },
        });
      }}
    />
  );
}
