import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { getAkawoGoal } from '@/api/endpoints/akawo';
import { AppText } from '@/components/ui/app-text';
import { formatMinorAmount } from '@/utils/money';
export default function AkawoDetailRoute() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const q = useQuery({
    queryKey: ['akawo-goal', goalId],
    queryFn: () => getAkawoGoal(goalId),
    enabled: Boolean(goalId),
  });
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      {q.isPending ? (
        <AppText>Loading goal…</AppText>
      ) : q.data ? (
        <>
          <AppText accessibilityRole="header" weight="bold">
            {q.data.name}
          </AppText>
          <AppText>{formatMinorAmount(q.data.savedMinor, q.data.currency)} saved</AppText>
          <AppText>
            {q.data.progressBps === null
              ? 'Flexible goal'
              : `${Math.round(q.data.progressBps / 100)}% complete`}
          </AppText>
          <AppText>
            Deposits and withdrawals remain unavailable until ledger account support is added.
          </AppText>
        </>
      ) : (
        <AppText>Goal unavailable.</AppText>
      )}
    </ScrollView>
  );
}
