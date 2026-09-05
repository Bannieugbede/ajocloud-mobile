import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AkawoPool, JoinedPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { JoinedPoolCard, OrganisedPoolCard } from './pool-card';
import { outstandingDues } from './pool-summary';

export type PoolsListScreenProps = {
  organised?: (AkawoPool & PoolTotals)[];
  joined?: JoinedPool[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onCreate: () => void;
  onJoin: () => void;
  onOpenOrganised: (poolId: string) => void;
  onOpenJoined: (poolId: string) => void;
};

export function PoolsListScreen(props: PoolsListScreenProps) {
  const { colors } = useTheme();
  const nothingYet = !props.organised?.length && !props.joined?.length;
  const dues = outstandingDues(props.joined);

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
      <View style={styles.actions}>
        <AppButton label="Join" variant="outline" onPress={props.onJoin} style={styles.action} />
        <AppButton label="Create" onPress={props.onCreate} style={styles.action} />
      </View>

      {dues.length ? (
        <View style={[styles.due, { backgroundColor: colors.warningSoft }]}>
          <View style={styles.dueHeader}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <AppText accessibilityRole="header" weight="semibold">
              {dues.length === 1 ? 'Payment due' : `${dues.length} payments due`}
            </AppText>
          </View>
          {dues.map((entry) => (
            <Pressable
              key={entry.poolId}
              accessibilityRole="button"
              accessibilityLabel={`Pay ${formatMinorAmount(
                entry.amountMinor,
                entry.currency,
              )} for ${entry.poolName}`}
              onPress={() => props.onOpenJoined(entry.poolId)}
              style={({ pressed }) => [styles.dueRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText style={styles.dueName} numberOfLines={1}>
                {entry.poolName}
              </AppText>
              <View style={[styles.duePill, { backgroundColor: colors.surface }]}>
                <AppText weight="semibold" style={{ color: colors.warning }}>
                  Pay {formatMinorAmount(entry.amountMinor, entry.currency)}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {props.loading ? (
        <>
          <AppSkeletonCard testID="pools-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {props.error ? (
        <AppErrorState
          title="Could not load your pools"
          description="Your pools could not be refreshed. Check your connection and try again."
          onRetry={props.onRetry}
        />
      ) : null}

      {!props.loading && !props.error && nothingYet ? (
        <AppEmptyState
          icon="people-circle-outline"
          title="No pools yet"
          description="Create a pool to collect from a group, or join one with a code you were given."
        />
      ) : null}

      {props.joined?.length ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="semibold" style={styles.sectionTitle}>
            Pools you joined
          </AppText>
          {props.joined.map((entry) => (
            <JoinedPoolCard
              key={entry.membershipId}
              pool={entry.pool}
              due={entry.due}
              onPress={() => props.onOpenJoined(entry.pool.id)}
            />
          ))}
        </View>
      ) : null}

      {props.organised?.length ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="semibold" style={styles.sectionTitle}>
            Pools you organise
          </AppText>
          {props.organised.map((pool) => (
            <OrganisedPoolCard
              key={pool.id}
              pool={pool}
              onPress={() => props.onOpenOrganised(pool.id)}
            />
          ))}
        </View>
      ) : null}

      {!props.loading && !props.error && !nothingYet ? (
        <AppCard onPress={props.onJoin} accessibilityLabel="Join a pool with a code">
          <View style={styles.rowBetween}>
            <View style={styles.joinText}>
              <AppText weight="semibold">Have a pool code?</AppText>
              <AppText style={{ color: colors.textMuted }}>
                Join a pool created by your organiser
              </AppText>
            </View>
            <AppText weight="semibold" style={{ color: colors.primary }}>
              Join
            </AppText>
          </View>
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },

  due: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },
  dueHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  dueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: sizes.touchTarget,
  },
  dueName: { flex: 1 },
  duePill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.body },
  joinText: { flex: 1, gap: 2 },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
