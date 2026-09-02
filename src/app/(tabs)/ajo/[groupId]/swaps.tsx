import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { approveAjoSwap, listAjoSwaps, rejectAjoSwap } from '@/api/endpoints/ajo-groups';
import type { AjoSwapRequest } from '@/api/endpoints/ajo-groups';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { SwapApprovalsScreen } from '@/features/ajo/swap-approvals-screen';
import type { AppError } from '@/types/errors';

export default function SwapApprovalsRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  // Captured once: Date.now during render is impure and would shift the
  // deadline on every re-render.
  const [now] = useState(() => new Date());
  const [deciding, setDeciding] = useState<string | null>(null);

  const swaps = useQuery({
    queryKey: ['ajo-swaps', groupId],
    queryFn: () => listAjoSwaps(groupId),
    enabled: Boolean(groupId),
  });

  const settle = useMutation({
    mutationFn: ({ swap, approve }: { swap: AjoSwapRequest; approve: boolean }) =>
      approve ? approveAjoSwap(groupId, swap.id) : rejectAjoSwap(groupId, swap.id),
    onSettled: () => setDeciding(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ajo-swaps', groupId] });
      // A settled swap can rewrite the rotation, so the group and its schedule
      // are no longer what was fetched.
      void queryClient.invalidateQueries({ queryKey: ['ajo-group', groupId] });
      void queryClient.invalidateQueries({ queryKey: ['ajo-schedule', groupId] });
    },
  });

  if (swaps.isPending) return <AppLoadingState label="Loading swap requests" />;
  if (swaps.isError || !swaps.data) {
    return (
      <AppErrorState
        description="Could not load swap requests."
        onRetry={() => void swaps.refetch()}
      />
    );
  }

  return (
    <SwapApprovalsScreen
      swaps={swaps.data}
      now={now}
      deciding={deciding}
      error={settle.error as AppError | null}
      onApprove={(swap) => {
        setDeciding(swap.id);
        settle.mutate({ swap, approve: true });
      }}
      onReject={(swap) => {
        setDeciding(swap.id);
        settle.mutate({ swap, approve: false });
      }}
    />
  );
}
