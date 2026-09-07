import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import {
  getFoodProgramme,
  listMySubscriptions,
  subscribeToProgramme,
  unsubscribeFromProgramme,
} from '@/api/endpoints/food-ajo';
import { FoodDetailScreen } from '@/features/food/food-detail-screen';
import type { AppError } from '@/types/errors';

export default function FoodProgrammeRoute() {
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const queryClient = useQueryClient();

  const programme = useQuery({
    queryKey: ['food-programme', programmeId],
    queryFn: () => getFoodProgramme(programmeId),
    enabled: Boolean(programmeId),
  });

  // Enrolment lives on the member's own list rather than the programme, so
  // both are needed before the screen can say whether they have joined.
  const subscriptions = useQuery({
    queryKey: ['food-subscriptions'],
    queryFn: listMySubscriptions,
  });
  const subscription = subscriptions.data?.find((entry) => entry.groupId === programmeId) ?? null;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['food-programme', programmeId] });
    void queryClient.invalidateQueries({ queryKey: ['food-subscriptions'] });
    void queryClient.invalidateQueries({ queryKey: ['food-programmes'] });
  };

  const subscribe = useMutation({
    mutationFn: (packageId: string) => subscribeToProgramme(programmeId, { packageId }),
    onSuccess: refresh,
  });
  const unsubscribe = useMutation({
    mutationFn: () => unsubscribeFromProgramme(programmeId),
    onSuccess: refresh,
  });

  return (
    <FoodDetailScreen
      {...(programme.data ? { programme: programme.data } : {})}
      subscription={subscription}
      loading={programme.isPending}
      error={programme.isError}
      refreshing={programme.isRefetching || subscriptions.isRefetching}
      submitting={subscribe.isPending || unsubscribe.isPending}
      actionError={(subscribe.error ?? unsubscribe.error) as AppError | null}
      onRefresh={() => {
        void programme.refetch();
        void subscriptions.refetch();
      }}
      onRetry={() => void programme.refetch()}
      onSubscribe={(packageId) => subscribe.mutate(packageId)}
      onUnsubscribe={() => unsubscribe.mutate()}
    />
  );
}
