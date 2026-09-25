import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { createPaymentIntent, getWalletBalance } from '@/api/endpoints/payments';
import { backTo } from '@/components/ui/app-header-back';
import { intentKey, topUpForShortfallMinor } from '@/features/payments/payment-flow';
import { PaymentMethodScreen } from '@/features/payments/payment-method-screen';
import { allowsPartPayment, withAmount } from '@/features/payments/payment-targets';
import { type PaymentRequest, usePaymentStore } from '@/store/payment-store';

export default function PaymentRoute() {
  const request = usePaymentStore((state) => state.request);
  const flowId = usePaymentStore((state) => state.flowId);

  useEffect(() => {
    // Arriving without a request means the flow was entered directly, e.g. by a
    // deep link. There is nothing to pay for, so return rather than show an
    // empty payment screen.
    if (!request) router.back();
  }, [request]);

  if (!request) return null;

  // Keyed by the flow, so a new payment — or switching to a top-up and back —
  // starts from nothing: no quote, no amount, no idempotency key from before.
  return <PaymentFlow key={flowId} flowId={flowId} request={request} />;
}

function PaymentFlow({ flowId, request }: { flowId: string; request: PaymentRequest }) {
  const startTopUp = usePaymentStore((state) => state.startTopUp);
  const queryClient = useQueryClient();
  const partial = allowsPartPayment(request.target);
  // Null pays everything owed; a string pays that much of it.
  const [amountMinor, setAmountMinor] = useState<string | null>(null);

  // A quote is an intent: creating one reads the amount and the methods from
  // the server. The key makes it idempotent, so a refetch returns the same
  // intent rather than another, and each amount has its own. That is what
  // makes it safe to express a POST as a query.
  const quote = (amount: string | null) => ({
    queryKey: ['payment-quote', flowId, amount] as const,
    queryFn: () =>
      createPaymentIntent(withAmount(request.target, amount), intentKey(flowId, amount)),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    // The one thing a member needs to hear when a payment fails to start.
    meta: { errorTitle: 'Nothing has been charged' },
  });

  // Everything owed, which a part payment is measured against. When paying
  // everything this is the same query as the one below, fetched once.
  const owed = useQuery({ ...quote(null), enabled: partial });
  const intent = useQuery(quote(amountMinor));
  const wallet = useQuery({ queryKey: ['wallet-balance'], queryFn: getWalletBalance });

  // A new amount is quoted before it is shown. The screen switches to it only
  // once the server has accepted it, so a refused amount leaves the working
  // quote in place rather than an error; the reason arrives as a toast.
  const [changingAmount, setChangingAmount] = useState(false);
  const changeAmount = (amount: string | null) => {
    setChangingAmount(true);
    queryClient
      .fetchQuery(quote(amount))
      .then(() => setAmountMinor(amount))
      .catch(() => undefined)
      .finally(() => setChangingAmount(false));
  };

  return (
    <>
      {/* The flow is entered from another tab, so there is no history to go
          back to. The product that started the payment is where back leads. */}
      <Stack.Screen
        options={{
          title: request.target.kind === 'WALLET_TOPUP' ? 'Add money' : 'Payment',
          ...backTo(request.returnTo as Href),
        }}
      />
      <PaymentMethodScreen
        title={request.title}
        {...(request.subtitle ? { subtitle: request.subtitle } : {})}
        {...(intent.data ? { intent: intent.data } : {})}
        {...(wallet.data ? { walletAvailableMinor: wallet.data.availableMinor } : {})}
        {...(partial && owed.data ? { owedMinor: owed.data.amountMinor } : {})}
        loading={intent.isPending}
        error={intent.isError && !intent.data}
        updatingAmount={changingAmount}
        onRetry={() => void intent.refetch()}
        onChangeAmount={changeAmount}
        onTopUp={(shortfallMinor) => startTopUp(topUpForShortfallMinor(shortfallMinor))}
        onContinue={(method) => {
          if (!intent.data || changingAmount) return;
          // push: this screen stays underneath, so the member can change their
          // mind at the PIN prompt without restarting the payment.
          router.push({
            pathname: '/(tabs)/pay/[intentId]',
            params: { intentId: intent.data.id, method },
          });
        }}
      />
    </>
  );
}
