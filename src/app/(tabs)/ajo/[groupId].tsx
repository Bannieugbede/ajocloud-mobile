import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { getAjoGroup } from '@/api/endpoints/ajo-groups';
import { AjoDetailScreen } from '@/features/ajo/ajo-detail-screen';
export default function AjoDetailRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const query = useQuery({
    queryKey: ['ajo-group', groupId],
    queryFn: () => getAjoGroup(groupId),
    enabled: Boolean(groupId),
  });
  return (
    <AjoDetailScreen
      group={query.data}
      loading={query.isPending}
      error={query.isError}
      onRetry={() => void query.refetch()}
    />
  );
}
