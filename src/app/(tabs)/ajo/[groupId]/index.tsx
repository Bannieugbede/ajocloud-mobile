import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { getAjoGroup, getAjoSchedule, lockAjoGroup } from '@/api/endpoints/ajo-groups';
import { getCurrentUser } from '@/api/endpoints/users';
import { AjoDetailScreen } from '@/features/ajo/ajo-detail-screen';
import { usePaymentStore } from '@/store/payment-store';
import { formatMinorAmount } from '@/utils/money';

export default function AjoGroupRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const startPayment = usePaymentStore((state) => state.start);

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
      onRequestSwap={() =>
        // push: the group stays underneath, so cancelling a swap returns to it.
        router.push({ pathname: '/(tabs)/ajo/[groupId]/swap', params: { groupId } })
      }
      onPayContribution={({ slotId, amountMinor, sequence }) => {
        startPayment({
          target: { kind: 'AJO_CONTRIBUTION', groupId, scheduleId: slotId },
          title: group.data?.name ?? 'Ajo contribution',
          subtitle: `Round ${sequence} · ${formatMinorAmount(amountMinor)}`,
          returnTo: `/(tabs)/ajo/${groupId}`,
        });
        router.push('/(tabs)/pay');
      }}
    />
  );
}
