import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { listFoodProgrammes } from '@/api/endpoints/food-ajo';
import { FoodListScreen } from '@/features/food/food-list-screen';
export default function FoodRoute() {
  const query = useQuery({ queryKey: ['food-programmes'], queryFn: listFoodProgrammes });
  return (
    <FoodListScreen
      programmes={query.data?.items}
      loading={query.isPending}
      error={query.isError}
      onRetry={() => void query.refetch()}
      onOpen={(id) =>
        router.push({ pathname: '/(tabs)/food/[programmeId]', params: { programmeId: id } })
      }
    />
  );
}
