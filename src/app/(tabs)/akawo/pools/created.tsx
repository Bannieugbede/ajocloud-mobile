import { router, useLocalSearchParams } from 'expo-router';

import { PoolCodeScreen } from '@/features/akawo/pool-code-screen';

export default function PoolCreatedRoute() {
  const { poolId, name, joinCode, amountMinor, currency } = useLocalSearchParams<{
    poolId: string;
    name: string;
    joinCode: string;
    amountMinor: string;
    currency: string;
  }>();

  return (
    <PoolCodeScreen
      poolName={name ?? 'Your pool'}
      joinCode={joinCode ?? ''}
      amountMinor={amountMinor ?? '0'}
      currency={currency ?? 'NGN'}
      // replace: this screen is the end of the create flow, so it is swapped for
      // the pool being managed rather than stacking on top of it.
      onDone={() =>
        router.replace({
          pathname: '/(tabs)/akawo/pools/[poolId]/manage',
          params: { poolId: poolId ?? '' },
        })
      }
    />
  );
}
