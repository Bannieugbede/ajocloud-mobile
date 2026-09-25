import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { joinAkawoPool, previewPool, type PoolPreview } from '@/api/endpoints/akawo-pools';
import { JoinPoolScreen } from '@/features/akawo/join-pool-screen';
import { normalisePoolCode } from '@/services/incoming-link';
import type { AppError } from '@/types/errors';

export default function JoinPoolRoute() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<PoolPreview | null>(null);
  // A code from a shared link. Validated before use: a link is anyone's to write.
  const linkedCode = normalisePoolCode(useLocalSearchParams<{ code?: string }>().code) ?? undefined;

  const lookup = useMutation({
    mutationFn: previewPool,
    onSuccess: setPreview,
  });

  // Looked up once on arrival, so a person who followed a link sees the pool
  // straight away rather than a code they have to submit themselves.
  const lookedUp = useRef(false);
  useEffect(() => {
    if (!linkedCode || lookedUp.current) return;
    lookedUp.current = true;
    lookup.mutate(linkedCode);
  }, [linkedCode, lookup]);

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
      initialCode={linkedCode}
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
