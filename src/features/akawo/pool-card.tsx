import { StyleSheet, View } from 'react-native';

import type { AkawoDue, AkawoPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
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
        <AppText weight="semibold" style={styles.name} numberOfLines={2}>
          {pool.name}
        </AppText>
        <Badge
          label={settled ? 'Complete' : statusLabel(pool.status)}
          tone={settled ? 'success' : pool.status === 'OPEN' ? 'info' : 'neutral'}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Amount" value={formatMinorAmount(pool.amountMinor, pool.currency)} />
        <Metric label="Members" value={String(pool.memberCount)} />
        <Metric label="Due date" value={dueLabel(pool.dueAt)} />
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
        <AppText weight="semibold" style={styles.name} numberOfLines={2}>
          {pool.name}
        </AppText>
        <Badge
          label={due ? statusLabel(due.status) : 'No due'}
          tone={settled ? 'success' : due ? 'warning' : 'neutral'}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Amount" value={amount} />
        <Metric label="Reference" value={pool.referenceLabel} />
        <Metric label="Due date" value={dueLabel(pool.dueAt)} />
      </View>

      {pool.purpose ? (
        <AppText style={{ color: colors.textMuted }} numberOfLines={2}>
          {pool.purpose}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function dueLabel(dueAt: string | null): string {
  if (!dueAt) return 'No deadline';
  const parsed = Date.parse(dueAt);
  return Number.isNaN(parsed)
    ? 'No deadline'
    : new Date(parsed).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
}) {
  const { colors } = useTheme();
  const palette = {
    success: { text: colors.success, background: colors.successSoft },
    warning: { text: colors.warning, background: colors.warningSoft },
    info: { text: colors.primary, background: colors.primarySoft },
    neutral: { text: colors.textMuted, background: colors.surfaceMuted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <AppText weight="semibold" style={[styles.badgeText, { color: palette.text }]}>
        {label}
      </AppText>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.metric}>
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>{label}</AppText>
      <AppText weight="semibold" numberOfLines={1}>
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
  name: { flex: 1, fontSize: fontSizes.body },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: fontSizes.caption },
  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, gap: 2 },
});
