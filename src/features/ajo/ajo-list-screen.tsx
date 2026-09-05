import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import { groupTone, rotationProgressBps, type GroupTone } from './group-summary';

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
  const count = props.groups?.length ?? 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <AppText style={{ color: colors.textMuted }}>
          {props.loading ? 'Loading your groups…' : `${count} ${count === 1 ? 'group' : 'groups'}`}
        </AppText>
        <View style={styles.actions}>
          <AppButton label="Join" variant="outline" onPress={props.onJoin} />
          <AppButton label="Create" onPress={props.onCreate} />
        </View>
      </View>

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

      {!props.loading && !props.error && count === 0 ? (
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
  const progressBps = rotationProgressBps(group);
  const variable = group.contributionMode === 'FLEXIBLE_UNIT';

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
          <AppText weight="semibold" style={styles.name} numberOfLines={2}>
            {group.name}
          </AppText>
          {variable ? (
            <View style={[styles.chip, { backgroundColor: colors.secondarySoft }]}>
              {/* Flexible groups let members hold several slots, so the amount
                  shown is this member's, not everyone's. Saying so avoids
                  reading it as the group-wide figure. */}
              <AppText weight="semibold" style={[styles.chipText, { color: colors.secondary }]}>
                Variable
              </AppText>
            </View>
          ) : null}
        </View>
        <StatusBadge tone={tone} label={statusLabel(group.status)} />
      </View>

      <View style={styles.metrics}>
        <Metric label="Members" value={String(group._count.members)} />
        <Metric
          label={variable ? 'My amount' : 'Contribution'}
          value={formatMinorAmount(group.baseContributionMinor, group.currency)}
        />
        <Metric label="Frequency" value={statusLabel(group.contributionFrequency)} />
      </View>

      <AppProgress
        progressBps={progressBps}
        label={`${group.name} slots filled`}
        showValue={false}
      />
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
        {group._count.slots} of {group.maxSlots} slots taken
      </AppText>
    </AppCard>
  );
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
      <AppText weight="semibold" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },

  card: { gap: spacing.md },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title: { flex: 1, gap: spacing.xs },
  name: { fontSize: fontSizes.body },

  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: fontSizes.caption, letterSpacing: 0.4 },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: { fontSize: fontSizes.caption },

  metrics: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, gap: 2 },
});
