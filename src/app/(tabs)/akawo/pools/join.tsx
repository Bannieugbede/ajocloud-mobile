import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { joinAkawoPool, previewPool, type PoolPreview } from '@/api/endpoints/akawo-pools';
import { JoinPoolScreen } from '@/features/akawo/join-pool-screen';
import type { AppError } from '@/types/errors';

export default function JoinPoolRoute() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<PoolPreview | null>(null);

  const lookup = useMutation({
    mutationFn: previewPool,
    onSuccess: setPreview,
  });

  const join = useMutation({
    mutationFn: joinAkawoPool,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['akawo-pools'] });
      // replace: joining is complete, so backing into the code form would only
      // let someone try to join a pool they are already in.
      router.replace({
        pathname: '/(tabs)/akawo/pools/[poolId]',
        params: { poolId: result.poolId },
      });
    },
  });

  return (
    <JoinPoolScreen
      preview={preview}
      looking={lookup.isPending}
      joining={join.isPending}
      error={(join.error ?? lookup.error) as AppError | null}
      onLookup={(joinCode) => lookup.mutate(joinCode)}
      onJoin={(values) => join.mutate(values)}
      onClearPreview={() => {
        setPreview(null);
        lookup.reset();
        join.reset();
      }}
    />
  );
}
