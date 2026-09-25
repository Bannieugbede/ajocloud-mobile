import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import { getMemberPool } from '@/api/endpoints/akawo-pools';
import { MemberPoolScreen } from '@/features/akawo/member-pool-screen';
import { usePayment } from '@/features/payments/use-payment';

export default function MemberPoolRoute() {
  const { poolId } = useLocalSearchParams<{ poolId: string }>();
  const payment = usePayment();

  const query = useQuery({
    queryKey: ['akawo-pool', poolId],
    queryFn: () => getMemberPool(poolId),
    enabled: Boolean(poolId),
  });

  return (
    <MemberPoolScreen
      data={query.data}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
      onRetry={() => void query.refetch()}
      onPay={() => {
        const due = query.data?.due;
        if (!due || !query.data) return;
        payment.start({
          target: { kind: 'AKAWO_POOL_DUE', poolId, dueId: due.id },
          title: query.data.pool.name,
          subtitle: query.data.membership.reference,
          returnTo: `/(tabs)/akawo/pools/${poolId}`,
        });
      }}
    />
  );
}
