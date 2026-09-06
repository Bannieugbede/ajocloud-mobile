import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { MemberPoolView } from '@/api/endpoints/akawo-pools';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { PoolHero } from './pool-hero';
import { dueLabel, paidAtLabel } from './pool-status';
import { deadlineLabel, expectedTotalMinor, progressBps } from './pool-summary';

type Panel = 'overview' | 'members';

/**
 * What a member sees.
 *
 * The Members panel shows names and whether each has paid, because the point of
 * a dues collection is that the group can see it is being collected fairly. It
 * shows no amounts other than the shared pool amount and no contact details:
 * the API returns a count and this member's own due, not other people's
 * payment records, which stay with the organiser.
 */
export function MemberPoolScreen({
  data,
  loading,
  error,
  refreshing,
  onRefresh,
  onRetry,
  onPay,
}: {
  data?: MemberPoolView;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onPay: () => void;
}) {
  const { colors } = useTheme();
  const [panel, setPanel] = useState<Panel>('overview');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppSkeletonCard testID="member-pool-skeleton" />
        <AppSkeletonCard />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppErrorState
          title="Could not load this pool"
          description="Check your connection and try again."
          onRetry={onRetry}
        />
      </View>
    );
  }

  const { pool, due, membership } = data;
  const outstanding = due?.status === 'PENDING';
  const settled = due?.status === 'PAID';
  const closed = pool.status !== 'OPEN';
  const paidAt = paidAtLabel(due);
  const pending = Math.max(0, data.memberCount - data.paidCount);
  // The member endpoint returns no target, so it is derived: one shared amount
  // per member is the rule every pool is created under.
  const targetMinor = expectedTotalMinor(pool.amountMinor, data.memberCount);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PoolHero
        label="TOTAL COLLECTED"
        collectedMinor={data.collectedMinor}
        targetMinor={targetMinor}
        currency={pool.currency}
        dueLabel={deadlineLabel(pool.dueAt)}
        paidCount={data.paidCount}
        memberCount={data.memberCount}
        progressBps={progressBps(data.collectedMinor, targetMinor)}
        testID="member-pool-hero"
      />

      {settled ? (
        <View style={[styles.notice, { backgroundColor: colors.successSoft }]}>
          <View style={styles.noticeHead}>
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color={colors.success}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <AppText weight="semibold" style={{ color: colors.success }}>
              Your payment is complete
            </AppText>
          </View>
          {paidAt ? <AppText style={{ color: colors.textMuted }}>Paid {paidAt}</AppText> : null}
        </View>
      ) : null}

      {outstanding && !closed ? (
        <AppButton
          label={`Pay ${formatMinorAmount(due?.amountMinor ?? pool.amountMinor, pool.currency)}`}
          onPress={onPay}
        />
      ) : null}

      {outstanding && closed ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText style={{ color: colors.text }}>
            This pool is {pool.status.toLowerCase()}, so it is no longer accepting payments. Speak
            to the organiser.
          </AppText>
        </View>
      ) : null}

      <AppSegmented
        label={pool.name}
        value={panel}
        onChange={setPanel}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'members', label: `Members (${data.memberCount})` },
        ]}
        testID="member-pool-tabs"
      />

      {panel === 'overview' ? (
        <>
          <AppCard>
            <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
              Pool Details
            </AppText>
            <DetailRow label="Organiser" value={pool.organiserName ?? 'Not recorded'} />
            <DetailRow
              label="Amount per member"
              value={formatMinorAmount(pool.amountMinor, pool.currency)}
            />
            <DetailRow label="Due date" value={deadlineLabel(pool.dueAt)} />
            <DetailRow label="Total members" value={String(data.memberCount)} />
            <DetailRow label="Paid" value={`${data.paidCount} members`} />
            <DetailRow label="Pending" value={`${pending} members`} />
          </AppCard>

          {pool.purpose ? (
            <AppCard>
              <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
                Description
              </AppText>
              <AppText style={{ color: colors.textMuted }}>{pool.purpose}</AppText>
            </AppCard>
          ) : null}

          <AppCard>
            <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
              Your entry
            </AppText>
            <DetailRow label="Name" value={membership.fullName} />
            <DetailRow label={pool.referenceLabel} value={membership.reference} />
            <DetailRow label="Your payment" value={dueLabel(due)} />
          </AppCard>
        </>
      ) : (
        <AppCard>
          <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
            Who has paid
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            {data.paidCount} of {data.memberCount} members have paid so far.
          </AppText>
          <AppDivider />
          {/* The organiser keeps the per-member record; a member sees the tally
              and their own entry, which is what the API returns here. */}
          <DetailRow label="Paid" value={`${data.paidCount} members`} />
          <DetailRow label="Still to pay" value={`${pending} members`} />
          <DetailRow
            label="Collected"
            value={formatMinorAmount(data.collectedMinor, pool.currency)}
          />
          <AppText style={[styles.footnote, { color: colors.textSubtle }]}>
            Ask your organiser for the full member record. They can export it as a PDF.
          </AppText>
        </AppCard>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.detail}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight="semibold" style={styles.detailValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  notice: { borderRadius: radius.lg, gap: spacing.xs, padding: spacing.md },
  noticeHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardTitle: { fontSize: fontSizes.body },
  detail: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailValue: { flexShrink: 1, textAlign: 'right' },
  footnote: { fontSize: fontSizes.caption },
});
