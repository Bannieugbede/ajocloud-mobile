import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { getAjoGroup, requestAjoSwap } from '@/api/endpoints/ajo-groups';
import { getCurrentUser } from '@/api/endpoints/users';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { SwapRequestScreen } from '@/features/ajo/swap-request-screen';
import type { AppError } from '@/types/errors';

export default function AjoSwapRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();

  const group = useQuery({
    queryKey: ['ajo-group', groupId],
    queryFn: () => getAjoGroup(groupId),
    enabled: Boolean(groupId),
  });

  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser });

  const swap = useMutation({
    mutationFn: (input: { fromSlotId: string; toSlotId: string; reason?: string }) =>
      requestAjoSwap(groupId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ajo-group', groupId] });
      // back, not replace: the request is pending approval, so the group screen
      // it returns to is still the right place and is already in the stack.
      router.back();
    },
  });

  if (group.isPending) return <AppLoadingState label="Loading positions" />;
  if (group.isError || !group.data) {
    return (
      <AppErrorState
        description="Could not load this group's positions."
        onRetry={() => void group.refetch()}
      />
    );
  }

  return (
    <SwapRequestScreen
      group={group.data}
      viewerUserId={user.data?.id ?? null}
      submitting={swap.isPending}
      error={swap.error as AppError | null}
      onSubmit={(input) => swap.mutate(input)}
    />
  );
}
