import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { AppActionSheet } from '@/components/ui/app-action-sheet';
import { AppBadge, type BadgeTone } from '@/components/ui/app-badge';
import { AppCard } from '@/components/ui/app-card';
import { AppFab } from '@/components/ui/app-fab';
import { AppMetricRow } from '@/components/ui/app-metric-row';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { shortDate } from '@/utils/dates';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import { groupTone, poolPerCycleMinor, roundLabel, roundProgressBps } from './group-summary';

export type AjoListScreenProps = {
  groups?: AjoGroupSummary[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onJoin: () => void;
};

/** Which slice of the member's groups is on screen. */
type AjoTab = 'active' | 'pending' | 'completed';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
] as const satisfies readonly { value: AjoTab; label: string }[];

/**
 * Which tab a backend status belongs to. A rotation that is locked or running
 * is active; anything still gathering members or paused is pending; a finished
 * or cancelled group is completed.
 */
function tabForStatus(status: string): AjoTab {
  switch (status) {
    case 'LOCKED':
    case 'ACTIVE':
      return 'active';
    case 'COMPLETED':
    case 'CANCELLED':
      return 'completed';
    default:
      return 'pending';
  }
}

export function AjoListScreen(props: AjoListScreenProps) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<AjoTab>('active');
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleGroups = (props.groups ?? []).filter((group) => tabForStatus(group.status) === tab);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Fixed above the list: the native header names the screen, and these
          tabs stay put while a pull-to-refresh drags only the rows beneath. */}
      <View style={styles.tabs}>
        <AppSegmented
          label="Ajo groups by status"
          options={TABS}
          value={tab}
          onChange={setTab}
          testID="ajo-status-tabs"
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: colors.background,
            // Clears the floating button, so the last card is never left
            // underneath it.
            paddingBottom: spacing.xxl + sizes.touchTarget,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={props.refreshing}
            onRefresh={props.onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {props.loading ? (
          <>
            <AppSkeletonCard testID="ajo-skeleton" />
            <AppSkeletonCard />
          </>
        ) : null}

        {props.error ? (
          <AppErrorState
            title="Could not load your groups"
            description="Your Ajo groups could not be refreshed. Check your connection and try again."
            onRetry={props.onRetry}
          />
        ) : null}

        {!props.loading && !props.error && !visibleGroups.length ? (
          <AppEmptyState
            icon="people-outline"
            title={
              !(props.groups ?? []).length
                ? 'No Ajo groups yet'
                : tab === 'active'
                  ? 'No active groups'
                  : tab === 'pending'
                    ? 'No pending groups'
                    : 'No completed groups'
            }
            description={
              !(props.groups ?? []).length
                ? 'Start a circle with people you trust, or join one with an invite code.'
                : tab === 'active'
                  ? 'Groups appear here once their rotation starts.'
                  : tab === 'pending'
                    ? 'Groups gathering members or paused appear here.'
                    : 'Finished groups appear here once their rotation ends.'
            }
            action="Create a group"
            onAction={props.onCreate}
            secondaryAction="Join with a code"
            onSecondaryAction={props.onJoin}
          />
        ) : null}

        {visibleGroups.map((group) => (
          <GroupCard key={group.id} group={group} onPress={() => props.onOpen(group.id)} />
        ))}
      </ScrollView>

      <AppFab
        label="Start"
        onPress={() => setSheetOpen(true)}
        bottomOffset={spacing.md}
        testID="ajo-start-fab"
      />

      <AppActionSheet
        visible={sheetOpen}
        title="Start an Ajo"
        onClose={() => setSheetOpen(false)}
        actions={[
          {
            label: 'Create',
            description: 'Create your own Ajo group and add your tribe',
            icon: 'add-circle-outline',
            onPress: props.onCreate,
          },
          {
            label: 'Join',
            description: 'Join an existing Ajo group and start saving',
            icon: 'enter-outline',
            onPress: props.onJoin,
          },
        ]}
        testID="ajo-start-sheet"
      />
    </View>
  );
}

function GroupCard({ group, onPress }: { group: AjoGroupSummary; onPress: () => void }) {
  const { colors } = useTheme();
  const tone = groupTone(group.status);
  const variable = group.contributionMode === 'FLEXIBLE_UNIT';
  const round = roundLabel(group);
  const nextDue = group.currentCycle?.contributionDueAt;

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Open ${group.name}, ${statusLabel(group.status)}, ${
        group._count.members
      } members, ${formatMinorAmount(group.baseContributionMinor, group.currency)} ${statusLabel(
        group.contributionFrequency,
      ).toLowerCase()}`}
      style={styles.card}
    >
      <View style={styles.titleRow}>
        <View style={styles.title}>
          <View style={styles.nameRow}>
            <AppText weight="bold" style={styles.name} numberOfLines={2}>
              {group.name}
            </AppText>
            {/* Flexible groups let members hold several slots, so the amount
                shown is this member's rather than everyone's. Saying so stops
                it reading as the group-wide figure. */}
            {variable ? <AppBadge label="Variable" tone="warning" /> : null}
          </View>
          {group.adminName ? (
            <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
              Admin: {group.adminName}
            </AppText>
          ) : null}
        </View>
        <AppBadge label={badgeLabel(group)} tone={BADGE_TONES[tone]} />
      </View>

      <AppMetricRow
        metrics={[
          { label: 'Members', value: String(group._count.members) },
          {
            label: variable ? 'My Amount' : 'Contribution',
            value: formatMinorAmount(group.baseContributionMinor, group.currency),
          },
          { label: 'Frequency', value: statusLabel(group.contributionFrequency) },
        ]}
      />

      {/* showValue is off: the percentage would repeat the round count on the
          line beneath it. */}
      <AppProgress
        progressBps={roundProgressBps(group)}
        label={`${group.name} rotation`}
        showValue={false}
        tone="success"
      />

      <View style={styles.footer}>
        <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
          {round ?? `${group._count.slots} of ${group.maxSlots} slots`}
        </AppText>
        {nextDue ? (
          <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
            Next: {shortDate(nextDue)}
          </AppText>
        ) : null}
      </View>

      {variable ? (
        <View style={[styles.pool, { backgroundColor: colors.warningSoft }]}>
          <AppText style={{ color: colors.textMuted }}>Pool per cycle</AppText>
          <AppText weight="bold" style={{ color: colors.warning }}>
            {formatMinorAmount(poolPerCycleMinor(group), group.currency)}
          </AppText>
        </View>
      ) : null}
    </AppCard>
  );
}

/** Maps the group's own tone vocabulary onto the shared badge's. */
const BADGE_TONES: Record<ReturnType<typeof groupTone>, BadgeTone> = {
  active: 'success',
  attention: 'warning',
  neutral: 'neutral',
};

/** A group waiting on its members is what the design calls "PAYOUT READY". */
function badgeLabel(group: AjoGroupSummary): string {
  if (group.status === 'LOCKED' || group.status === 'OPEN') return 'PAYOUT READY';
  return statusLabel(group.status).toUpperCase();
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabs: { padding: spacing.md, paddingBottom: 0 },
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

  card: { gap: spacing.md },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title: { flex: 1, gap: 2 },
  nameRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  name: { fontSize: fontSizes.body },

  footer: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },

  pool: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
});
