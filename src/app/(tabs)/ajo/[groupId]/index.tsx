import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { Alert } from 'react-native';

import {
  createGroupInvitation,
  getAjoGroup,
  getAjoSchedule,
  listAjoSwaps,
  lockAjoGroup,
  setAjoGroupListing,
} from '@/api/endpoints/ajo-groups';
import { getCurrentUser } from '@/api/endpoints/users';
import { AjoDetailScreen } from '@/features/ajo/ajo-detail-screen';
import { groupShareMessage, shareContent } from '@/services/share-links';
import type { AppError } from '@/types/errors';

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

  // A listed group is shared by its permanent link, which admits anyone and
  // costs nothing. An unlisted one needs an invitation: single-use, issued for
  // this share, because a link forwarded beyond the person it was meant for
  // should not admit a whole group chat.
  const invite = useMutation({
    mutationFn: async () => {
      const current = group.data;
      if (!current) return;
      const code =
        current.publiclyListed && current.shortCode
          ? current.shortCode
          : (await createGroupInvitation(groupId, { maxUses: 1 })).code;
      await shareContent(groupShareMessage(current.name, code));
    },
    onError: (error: unknown) =>
      Alert.alert(
        'Could not create a link',
        (error as AppError | null)?.message ?? 'Please try again.',
      ),
  });

  const listing = useMutation({
    mutationFn: (listed: boolean) => setAjoGroupListing(groupId, listed),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ajo-group', groupId] }),
    onError: (error: unknown) =>
      Alert.alert(
        'Could not change the listing',
        (error as AppError | null)?.message ?? 'Please try again.',
      ),
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
      inviting={invite.isPending}
      listing={listing.isPending}
      onInvite={() => invite.mutate()}
      onSetListing={(listed) => listing.mutate(listed)}
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
