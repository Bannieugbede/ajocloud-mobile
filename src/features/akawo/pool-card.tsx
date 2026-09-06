import { StyleSheet, View } from 'react-native';

import type { AkawoDue, AkawoPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppBadge } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import { deadlineLabel } from './pool-summary';

/** One pool in the organiser's list, with how much of it has been collected. */
export function OrganisedPoolCard({
  pool,
  onPress,
}: {
  pool: AkawoPool & PoolTotals;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const settled = pool.memberCount > 0 && pool.paidCount === pool.memberCount;

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Open ${pool.name}, ${pool.paidCount} of ${pool.memberCount} paid, ${formatMinorAmount(
        pool.collectedMinor,
        pool.currency,
      )} collected`}
      style={styles.card}
    >
      <View style={styles.titleRow}>
        <AppText weight="bold" style={styles.name} numberOfLines={2}>
          {pool.name}
        </AppText>
        <AppBadge
          label={settled ? 'Complete' : statusLabel(pool.status)}
          tone={settled ? 'success' : pool.status === 'OPEN' ? 'info' : 'neutral'}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Amount" value={formatMinorAmount(pool.amountMinor, pool.currency)} />
        <Metric label="Members" value={String(pool.memberCount)} />
        <Metric label="Due date" value={deadlineLabel(pool.dueAt)} />
      </View>

      {pool.memberCount > 0 ? (
        <AppProgress
          progressBps={pool.progressBps}
          label={`${pool.name} collection`}
          showValue={false}
        />
      ) : null}
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
        {pool.paidCount}/{pool.memberCount} paid ·{' '}
        {formatMinorAmount(pool.collectedMinor, pool.currency)} collected
      </AppText>
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
  const amount = formatMinorAmount(due?.amountMinor ?? pool.amountMinor, pool.currency);

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Open ${pool.name}, ${amount}, ${
        due ? statusLabel(due.status) : 'no due recorded'
      }`}
      style={styles.card}
    >
      <View style={styles.titleRow}>
        <View style={styles.title}>
          <AppText weight="bold" style={styles.name} numberOfLines={2}>
            {pool.name}
          </AppText>
          {pool.organiserName ? (
            // Whom a member is paying is what makes a collection trustworthy,
            // so the card says it rather than leaving it to a tap.
            <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
              {pool.organiserName}
            </AppText>
          ) : null}
        </View>
        <AppBadge
          label={due ? statusLabel(due.status) : 'No due'}
          tone={settled ? 'success' : due ? 'warning' : 'neutral'}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Amount" value={amount} />
        <Metric label="Reference" value={pool.referenceLabel} />
        <Metric label="Due date" value={deadlineLabel(pool.dueAt)} />
      </View>

      {pool.purpose ? (
        <AppText style={{ color: colors.textMuted }} numberOfLines={2}>
          {pool.purpose}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metric}>
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>{label}</AppText>
      <AppText weight="bold" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title: { flex: 1, gap: 2 },
  name: { flex: 1, fontSize: fontSizes.body },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, gap: 2 },
});
