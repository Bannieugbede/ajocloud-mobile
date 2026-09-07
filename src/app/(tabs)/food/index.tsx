import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  listFoodProgrammes,
  listMyCoordinatorApplications,
  listMySubscriptions,
} from '@/api/endpoints/food-ajo';
import { FoodListScreen } from '@/features/food/food-list-screen';

export default function FoodRoute() {
  const programmes = useQuery({ queryKey: ['food-programmes'], queryFn: listFoodProgrammes });
  const subscriptions = useQuery({
    queryKey: ['food-subscriptions'],
    queryFn: listMySubscriptions,
    retry: 1,
  });
  // Failure here must not empty the tab: the banner is context, and the
  // programmes below it are what the screen is for.
  const applications = useQuery({
    queryKey: ['food-coordinator-applications'],
    queryFn: listMyCoordinatorApplications,
    retry: 1,
  });

  const refetchAll = () => {
    void Promise.all([programmes.refetch(), subscriptions.refetch(), applications.refetch()]);
  };

  return (
    <FoodListScreen
      programmes={programmes.data?.items}
      subscriptions={subscriptions.data}
      applications={applications.data}
      loading={programmes.isPending}
      error={programmes.isError}
      refreshing={programmes.isRefetching || subscriptions.isRefetching}
      onRefresh={refetchAll}
      onRetry={refetchAll}
      onOpen={(id) =>
        router.push({ pathname: '/(tabs)/food/[programmeId]', params: { programmeId: id } })
      }
      onApplyAsCoordinator={() => router.push('/(tabs)/food/apply')}
    />
  );
}
