import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { listAkawoGoals } from '@/api/endpoints/akawo';
import { AkawoListScreen } from '@/features/akawo/akawo-list-screen';
export default function AkawoRoute() {
  const query = useQuery({ queryKey: ['akawo-goals'], queryFn: listAkawoGoals });
  return (
    <AkawoListScreen
      goals={query.data}
      loading={query.isPending}
      onOpen={(id) => router.push({ pathname: '/(tabs)/akawo/[goalId]', params: { goalId: id } })}
      onOpenPools={() => router.back()}
      onCreateGoal={() => router.push('/(tabs)/akawo/create-goal')}
    />
  );
}
