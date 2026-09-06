import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { AkawoDue, AkawoPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppBadge, type BadgeTone } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import { dueLabel, dueTone } from './pool-status';
import { shortDeadlineLabel } from './pool-summary';

/**
 * One pool in a list.
 *
 * Both sides of a collection are the same card: name, who is running it, the
 * three facts that decide whether to act, and how far the group has got. What
 * differs is only the badge — an organiser is told the pool's state, a member is
 * told their own — so the shape is shared rather than drawn twice.
 */
function PoolCard({
  name,
  subtitle,
  badge,
  amountLabel,
  memberCount,
  dueAt,
  paidCount,
  collectedMinor,
  currency,
  accessibilityLabel,
  onPress,
}: {
  name: string;
  subtitle?: string | null;
  badge: { label: string; tone: BadgeTone };
  amountLabel: string;
  memberCount: number;
  dueAt: string | null;
  paidCount: number;
  collectedMinor: string;
  currency: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  // Defended against a server that does not send totals yet: a card must degrade
  // to showing what it does know rather than rendering "undefined paid", and the
  // whole tab must never come down over a missing count.
  const members = Number.isFinite(memberCount) ? memberCount : 0;
  const paid = Number.isFinite(paidCount) ? paidCount : 0;
  const progressBps = members > 0 ? Math.round((paid / members) * 10_000) : 0;

  return (
    <AppCard onPress={onPress} accessibilityLabel={accessibilityLabel} style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.title}>
          <AppText weight="bold" style={styles.name} numberOfLines={2}>
            {name}
          </AppText>
          {subtitle ? (
            // Whom a member is paying is what makes a collection trustworthy,
            // so the card says it rather than leaving it to a tap.
            <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <AppBadge label={badge.label} tone={badge.tone} />
      </View>

      <View style={styles.metrics}>
        <Metric label="Amount" value={amountLabel} />
        <Metric label="Members" value={String(members)} />
        <Metric label="Due Date" value={shortDeadlineLabel(dueAt)} />
      </View>

      {members > 0 ? (
        <AppProgress
          progressBps={progressBps}
          label={`${name} collection`}
          showValue={false}
          tone="success"
        />
      ) : null}

      <View style={styles.footer}>
        <AppText style={[styles.footerText, { color: colors.textMuted }]} numberOfLines={1}>
          {paid}/{members} paid · {formatMinorAmount(collectedMinor ?? '0', currency)} collected
        </AppText>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textMuted}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </AppCard>
  );
}

/** One pool in the organiser's list, with how much of it has been collected. */
export function OrganisedPoolCard({
  pool,
  onPress,
}: {
  pool: AkawoPool & PoolTotals;
  onPress: () => void;
}) {
  const settled = pool.memberCount > 0 && pool.paidCount === pool.memberCount;

  return (
    <PoolCard
      name={pool.name}
      subtitle={pool.purpose}
      badge={{
        label: settled ? 'Complete' : statusLabel(pool.status),
        tone: settled ? 'success' : pool.status === 'OPEN' ? 'info' : 'neutral',
      }}
      amountLabel={formatMinorAmount(pool.amountMinor, pool.currency)}
      memberCount={pool.memberCount}
      dueAt={pool.dueAt}
      paidCount={pool.paidCount}
      collectedMinor={pool.collectedMinor}
      currency={pool.currency}
      accessibilityLabel={`Open ${pool.name}, ${pool.paidCount} of ${pool.memberCount} paid, ${formatMinorAmount(
        pool.collectedMinor,
        pool.currency,
      )} collected`}
      onPress={onPress}
    />
  );
}

/** One pool the user has joined, badged with what they personally owe. */
export function JoinedPoolCard({
  pool,
  due,
  totals,
  onPress,
}: {
  pool: AkawoPool;
  due: AkawoDue | null;
  totals: PoolTotals;
  onPress: () => void;
}) {
  const amount = formatMinorAmount(due?.amountMinor ?? pool.amountMinor, pool.currency);

  return (
    <PoolCard
      name={pool.name}
      subtitle={pool.organiserName}
      badge={{ label: dueLabel(due), tone: dueTone(due) }}
      amountLabel={amount}
      memberCount={totals.memberCount}
      dueAt={pool.dueAt}
      paidCount={totals.paidCount}
      collectedMinor={totals.collectedMinor}
      currency={pool.currency}
      accessibilityLabel={`Open ${pool.name}, ${amount}, ${dueLabel(due)}`}
      onPress={onPress}
    />
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
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  footerText: { flex: 1, fontSize: fontSizes.caption },
});
