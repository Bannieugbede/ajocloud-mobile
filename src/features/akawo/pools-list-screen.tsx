import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AkawoPool, JoinedPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppButton } from '@/components/ui/app-button';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import { JoinedPoolCard, OrganisedPoolCard } from './pool-card';

export function PoolsListScreen({
  organised,
  joined,
  loading,
  error,
  refreshing,
  onRefresh,
  onRetry,
  onCreate,
  onJoin,
  onOpenOrganised,
  onOpenJoined,
}: {
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
}) {
  const { colors } = useTheme();
  const nothingYet = !organised?.length && !joined?.length;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.actions}>
        <AppButton label="Create a pool" onPress={onCreate} style={styles.action} />
        <AppButton
          label="Join with a code"
          variant="outline"
          onPress={onJoin}
          style={styles.action}
        />
      </View>

      {loading ? (
        <>
          <AppSkeletonCard testID="pools-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {error ? (
        <AppErrorState
          title="Could not load your pools"
          description="Your pools could not be refreshed. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : null}

      {!loading && !error && nothingYet ? (
        <AppEmptyState
          icon="people-circle-outline"
          title="No pools yet"
          description="Create a pool to collect from a group, or join one with a code you were given."
        />
      ) : null}

      {joined?.length ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="semibold">
            Pools you joined
          </AppText>
          {joined.map((entry) => (
            <JoinedPoolCard
              key={entry.membershipId}
              pool={entry.pool}
              due={entry.due}
              onPress={() => onOpenJoined(entry.pool.id)}
            />
          ))}
        </View>
      ) : null}

      {organised?.length ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="semibold">
            Pools you organise
          </AppText>
          {organised.map((pool) => (
            <OrganisedPoolCard key={pool.id} pool={pool} onPress={() => onOpenOrganised(pool.id)} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  section: { gap: spacing.sm },
});
