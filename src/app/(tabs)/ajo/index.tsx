import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { listAjoGroups } from '@/api/endpoints/ajo-groups';
import { AjoListScreen } from '@/features/ajo/ajo-list-screen';
export default function AjoRoute() {
  const query = useQuery({ queryKey: ['ajo-groups'], queryFn: listAjoGroups });
  return (
    <AjoListScreen
      groups={query.data}
      loading={query.isPending}
      error={query.isError}
      onRetry={() => void query.refetch()}
      onOpen={(id) => router.push({ pathname: '/(tabs)/ajo/[groupId]', params: { groupId: id } })}
    />
  );
}
