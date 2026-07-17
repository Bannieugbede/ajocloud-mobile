import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { getFoodProgramme } from '@/api/endpoints/food-ajo';
import { FoodDetailScreen } from '@/features/food/food-detail-screen';
export default function FoodDetailRoute() {
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const query = useQuery({
    queryKey: ['food-programme', programmeId],
    queryFn: () => getFoodProgramme(programmeId),
    enabled: Boolean(programmeId),
  });
  return (
    <FoodDetailScreen
      programme={query.data}
      loading={query.isPending}
      error={query.isError}
      onRetry={() => void query.refetch()}
    />
  );
}
