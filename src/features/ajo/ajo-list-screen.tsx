import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { AppBadge, type BadgeTone } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppMetricRow } from '@/components/ui/app-metric-row';
import { AppProgress } from '@/components/ui/app-progress';
import { AppScreenHeader } from '@/components/ui/app-screen-header';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
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

export function AjoListScreen(props: AjoListScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const active = (props.groups ?? []).filter((group) => group.status === 'ACTIVE').length;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm },
      ]}
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.onRefresh}
          tintColor={colors.primary}
          progressViewOffset={insets.top}
        />
      }
    >
      <AppScreenHeader
        title="My Ajo Groups"
        subtitle={
          props.loading
            ? 'Loading your groups…'
            : `${active} active ${active === 1 ? 'group' : 'groups'}`
        }
      >
        <AppButton
          label="Join"
          icon="person-add-outline"
          variant="outline"
          size="compact"
          onPress={props.onJoin}
        />
        <AppButton label="Create" icon="add" size="compact" onPress={props.onCreate} />
      </AppScreenHeader>

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

      {!props.loading && !props.error && !props.groups?.length ? (
        <AppEmptyState
          icon="people-outline"
          title="No Ajo groups yet"
          description="Start a circle with people you trust, or join one with an invite code."
          action="Create a group"
          onAction={props.onCreate}
          secondaryAction="Join with a code"
          onSecondaryAction={props.onJoin}
        />
      ) : null}

      {props.groups?.map((group) => (
        <GroupCard key={group.id} group={group} onPress={() => props.onOpen(group.id)} />
      ))}
    </ScrollView>
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
