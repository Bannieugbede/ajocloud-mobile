import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { listFoodProgrammes, listMySubscriptions } from '@/api/endpoints/food-ajo';
import { FoodListScreen } from '@/features/food/food-list-screen';

export default function FoodRoute() {
  const programmes = useQuery({
    queryKey: ['food-programmes'],
    queryFn: () => listFoodProgrammes(),
  });
  const subscriptions = useQuery({
    queryKey: ['food-subscriptions'],
    queryFn: listMySubscriptions,
    retry: 1,
  });

  const refetchAll = () => {
    void Promise.all([programmes.refetch(), subscriptions.refetch()]);
  };

  return (
    <FoodListScreen
      programmes={programmes.data?.items}
      subscriptions={subscriptions.data}
      loading={programmes.isPending}
      error={programmes.isError}
      refreshing={programmes.isRefetching || subscriptions.isRefetching}
      onRefresh={refetchAll}
      onRetry={refetchAll}
      onOpen={(id) =>
        router.push({ pathname: '/(tabs)/food/[programmeId]', params: { programmeId: id } })
      }
      // Creating a programme is a coordinator's action, and coordinating is
      // what the application grants. Someone who has not been approved is sent
      // to apply rather than to a form the backend would refuse.
      onCreate={() => router.push('/(tabs)/food/apply')}
      // There is no join-by-code for Food: a programme is joined by opening it
      // and subscribing to a package, so this goes to the list rather than
      // inventing a code entry screen for a code nobody issues.
      onJoin={() => router.push('/(tabs)/food')}
    />
  );
}
