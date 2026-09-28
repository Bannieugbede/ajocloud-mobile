import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { createAkawoPool } from '@/api/endpoints/akawo-pools';
import { CreatePoolScreen } from '@/features/akawo/create-pool-screen';
import type { AppError } from '@/types/errors';
import { KycGate } from '@/features/kyc/kyc-gate';

function CreatePoolRouteContent() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createAkawoPool,
    onSuccess: (pool) => {
      void queryClient.invalidateQueries({ queryKey: ['akawo-pools'] });
      // replace: the form has been submitted, so backing into it would offer to
      // create a second pool. The code screen returns to the list instead.
      router.replace({
        pathname: '/(tabs)/akawo/pools/created',
        params: {
          poolId: pool.id,
          name: pool.name,
          joinCode: pool.joinCode,
          amountMinor: pool.amountMinor,
          currency: pool.currency,
        },
      });
    },
  });

  return (
    <CreatePoolScreen
      submitting={mutation.isPending}
      error={mutation.error as AppError | null}
      onSubmit={(values) => mutation.mutate(values)}
    />
  );
}

/** Shown once the member has reached the stage `akawo-pool.create` needs (ADR-015). */
export default function CreatePoolRoute() {
  return (
    <KycGate action="akawo-pool.create">
      <CreatePoolRouteContent />
    </KycGate>
  );
}
