import { View } from 'react-native';

import type { AkawoDue, AkawoPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppAmount } from '@/components/ui/app-amount';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { statusLabel } from '@/utils/status';

/** One pool in the organiser's list, with how much of it has been collected. */
export function OrganisedPoolCard({
  pool,
  onPress,
}: {
  pool: AkawoPool & PoolTotals;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <AppCard onPress={onPress} accessibilityLabel={`Open ${pool.name}`}>
      <AppText weight="semibold">{pool.name}</AppText>
      <AppText style={{ color: colors.textMuted }}>
        {statusLabel(pool.status)} · {pool.paidCount} of {pool.memberCount} paid
      </AppText>
      {pool.memberCount > 0 ? (
        <AppProgress progressBps={pool.progressBps} label={`${pool.name} collection`} />
      ) : null}
      <AppAmount amountMinor={pool.collectedMinor} currency={pool.currency} />
    </AppCard>
  );
}

/** One pool the user has joined, showing what they personally owe. */
export function JoinedPoolCard({
  pool,
  due,
  onPress,
}: {
  pool: AkawoPool;
  due: AkawoDue | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const settled = due?.status === 'PAID' || due?.status === 'WAIVED';

  return (
    <AppCard onPress={onPress} accessibilityLabel={`Open ${pool.name}`}>
      <AppText weight="semibold">{pool.name}</AppText>
      <View style={{ gap: 2 }}>
        <AppAmount amountMinor={due?.amountMinor ?? pool.amountMinor} currency={pool.currency} />
        <AppText style={{ color: settled ? colors.success : colors.warning }}>
          {due ? statusLabel(due.status) : 'No due recorded'}
        </AppText>
      </View>
    </AppCard>
  );
}
