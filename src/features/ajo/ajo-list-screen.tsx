import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreenHeader } from '@/components/ui/app-screen-header';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  groupTone,
  poolPerCycleMinor,
  roundLabel,
  roundProgressBps,
  type GroupTone,
} from './group-summary';

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
        <AppButton label="Join" variant="outline" onPress={props.onJoin} />
        <AppButton label="Create" onPress={props.onCreate} />
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
          description="Groups you create or join will appear here."
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
            {variable ? (
              <View style={[styles.chip, { backgroundColor: colors.warningSoft }]}>
                {/* Flexible groups let members hold several slots, so the
                    amount shown is this member's rather than everyone's.
                    Saying so stops it reading as the group-wide figure. */}
                <AppText weight="semibold" style={[styles.chipText, { color: colors.warning }]}>
                  VARIABLE
                </AppText>
              </View>
            ) : null}
          </View>
          {group.adminName ? (
            <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
              Admin: {group.adminName}
            </AppText>
          ) : null}
        </View>
        <StatusBadge tone={tone} label={badgeLabel(group)} />
      </View>

      <View style={styles.metrics}>
        <Metric label="Members" value={String(group._count.members)} />
        <Metric
          label={variable ? 'My Amount' : 'Contribution'}
          value={formatMinorAmount(group.baseContributionMinor, group.currency)}
        />
        <Metric label="Frequency" value={statusLabel(group.contributionFrequency)} />
      </View>

      {/* A plain bar rather than AppProgress: the percentage it prints would
          repeat the round count on the line beneath it. */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
      >
        <View
          style={[
            styles.trackFill,
            {
              backgroundColor: colors.primary,
              width: `${Math.round(roundProgressBps(group) / 100)}%`,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
          {round ?? `${group._count.slots} of ${group.maxSlots} slots`}
        </AppText>
        {nextDue ? (
          <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
            Next: {formatDueDate(nextDue)}
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

/** A group waiting on its members is what the design calls "PAYOUT READY". */
function badgeLabel(group: AjoGroupSummary): string {
  if (group.status === 'LOCKED' || group.status === 'OPEN') return 'PAYOUT READY';
  return statusLabel(group.status).toUpperCase();
}

function formatDueDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ tone, label }: { tone: GroupTone; label: string }) {
  const { colors } = useTheme();
  const palette = {
    active: { text: colors.success, background: colors.successSoft },
    attention: { text: colors.warning, background: colors.warningSoft },
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
      <AppText weight="bold" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
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

  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  badgeText: { fontSize: 10, letterSpacing: 0.5 },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  chipText: { fontSize: 10, letterSpacing: 0.5 },

  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, gap: 2 },

  track: { borderRadius: radius.pill, height: 6, overflow: 'hidden', width: '100%' },
  trackFill: { borderRadius: radius.pill, height: '100%' },
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
