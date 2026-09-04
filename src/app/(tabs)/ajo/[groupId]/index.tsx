import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import {
  getAjoGroup,
  getAjoSchedule,
  listAjoSwaps,
  lockAjoGroup,
} from '@/api/endpoints/ajo-groups';
import { getCurrentUser } from '@/api/endpoints/users';
import { AjoDetailScreen } from '@/features/ajo/ajo-detail-screen';

export default function AjoGroupRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();

  const group = useQuery({
    queryKey: ['ajo-group', groupId],
    queryFn: () => getAjoGroup(groupId),
    enabled: Boolean(groupId),
  });

  // The schedule is a separate request because it only exists once the group is
  // locked; the detail screen joins the two to name who holds each position.
  const schedule = useQuery({
    queryKey: ['ajo-schedule', groupId],
    queryFn: () => getAjoSchedule(groupId),
    enabled: Boolean(groupId),
  });

  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser });

  // Fetched here so the entry point can say a decision is needed, rather than
  // making the member open the screen to discover it.
  const swaps = useQuery({
    queryKey: ['ajo-swaps', groupId],
    queryFn: () => listAjoSwaps(groupId),
    enabled: Boolean(groupId),
  });

  const lock = useMutation({
    mutationFn: () => lockAjoGroup(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ajo-group', groupId] });
      void queryClient.invalidateQueries({ queryKey: ['ajo-schedule', groupId] });
    },
  });

  return (
    <AjoDetailScreen
      {...(group.data ? { group: group.data } : {})}
      {...(schedule.data ? { cycles: schedule.data } : {})}
      viewerUserId={user.data?.id ?? null}
      loading={group.isPending}
      error={group.isError}
      locking={lock.isPending}
      onRetry={() => {
        void group.refetch();
        void schedule.refetch();
      }}
      onLock={() => lock.mutate()}
      swapsAwaitingMe={swaps.data?.filter((swap) => swap.awaitingMyDecision).length ?? 0}
      onRequestSwap={() =>
        // push: the group stays underneath, so cancelling a swap returns to it.
        router.push({ pathname: '/(tabs)/ajo/[groupId]/swap', params: { groupId } })
      }
      onViewSwaps={() =>
        router.push({ pathname: '/(tabs)/ajo/[groupId]/swaps', params: { groupId } })
      }
      onPayContribution={({ scheduleId, amountMinor, amountPaidMinor, currency, sequence }) => {
        // Straight to the contribution route rather than through the shared
        // payment flow: that flow's AJO_CONTRIBUTION target is not implemented
        // server-side, so it would take the member to a dead end.
        router.push({
          pathname: '/(tabs)/ajo/[groupId]/contribute',
          params: {
            groupId,
            scheduleId,
            groupName: group.data?.name ?? 'Your group',
            sequence: String(sequence),
            amountDueMinor: amountMinor,
            amountPaidMinor,
            currency,
          },
        });
      }}
    />
  );
}
