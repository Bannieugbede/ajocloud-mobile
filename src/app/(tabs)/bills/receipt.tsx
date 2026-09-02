import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { getBillPayment } from '@/api/endpoints/bill-payments';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { BillReceiptScreen } from '@/features/bills/bill-receipt-screen';
import { shouldPollBill } from '@/features/bills/bill-amount';

export default function BillReceiptRoute() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();

  const payment = useQuery({
    queryKey: ['bill-payment', paymentId],
    queryFn: () => getBillPayment(paymentId),
    enabled: Boolean(paymentId),
    // Polls only while the provider could still change the outcome; a settled
    // payment will not change on its own, so polling it is wasted work.
    refetchInterval: (query) =>
      query.state.data && shouldPollBill(query.state.data.status) ? 5_000 : false,
  });

  if (payment.isPending) return <AppLoadingState label="Loading receipt" />;
  if (payment.isError || !payment.data) {
    return (
      <AppErrorState
        description="Could not load this receipt."
        onRetry={() => void payment.refetch()}
      />
    );
  }

  return (
    <BillReceiptScreen
      payment={payment.data}
      // replace: the payment flow is finished, so it is unwound rather than
      // left in the stack behind the list.
      onDone={() => router.replace('/(tabs)/bills')}
      onRetry={() => router.replace('/(tabs)/bills')}
    />
  );
}
