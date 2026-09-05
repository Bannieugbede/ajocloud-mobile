import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { listJoinedPools, listOrganisedPools } from '@/api/endpoints/akawo-pools';
import { PoolsListScreen } from '@/features/akawo/pools-list-screen';

export default function AkawoRoute() {
  const organised = useQuery({
    queryKey: ['akawo-pools', 'organised'],
    queryFn: listOrganisedPools,
  });
  const joined = useQuery({ queryKey: ['akawo-pools', 'joined'], queryFn: listJoinedPools });

  return (
    <PoolsListScreen
      organised={organised.data}
      joined={joined.data}
      loading={organised.isPending || joined.isPending}
      error={organised.isError || joined.isError}
      refreshing={organised.isRefetching || joined.isRefetching}
      onRefresh={() => {
        void organised.refetch();
        void joined.refetch();
      }}
      onRetry={() => {
        void organised.refetch();
        void joined.refetch();
      }}
      // push: the list stays underneath so cancelling returns to it.
      onCreate={() => router.push('/(tabs)/akawo/pools/create')}
      onJoin={() => router.push('/(tabs)/akawo/pools/join')}
      onOpenOrganised={(poolId) =>
        router.push({ pathname: '/(tabs)/akawo/pools/[poolId]/manage', params: { poolId } })
      }
      onOpenJoined={(poolId) =>
        router.push({ pathname: '/(tabs)/akawo/pools/[poolId]', params: { poolId } })
      }
      onOpenGoals={() => router.push('/(tabs)/akawo/goals')}
    />
  );
}
