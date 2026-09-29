import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AkawoPool, JoinedPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { AppActionSheet } from '@/components/ui/app-action-sheet';
import { AppCard } from '@/components/ui/app-card';
import { AppFab } from '@/components/ui/app-fab';
import { AppSegmented } from '@/components/ui/app-segmented';
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
  /** Personal savings goals, which share the Akawo name but not this screen. */
  onOpenGoals: () => void;
};

/** Which half of the tab is on screen. */
type AkawoTab = 'joined' | 'organised';

const TABS = [
  { value: 'joined', label: 'Joined' },
  { value: 'organised', label: 'Organised' },
] as const satisfies readonly { value: AkawoTab; label: string }[];

export function PoolsListScreen(props: PoolsListScreenProps) {
  const { colors } = useTheme();
  const [tab, setTab] = useState<AkawoTab>('joined');
  const [sheetOpen, setSheetOpen] = useState(false);
  const nothingYet = !props.organised?.length && !props.joined?.length;
  const dues = outstandingDues(props.joined);
  const showingJoined = tab === 'joined';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        <AppSegmented
          label="Akawo pools"
          options={TABS}
          value={tab}
          onChange={setTab}
          testID="akawo-tabs"
        />

        {/* Dues belong to joined pools, so the banner lives on the Joined tab:
            showing it over organised pools would point at rows that are not on
            screen. */}
        {showingJoined && dues.length ? (
          <View style={[styles.due, { backgroundColor: colors.warningSoft }]}>
            <View style={styles.dueHeader}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              <AppText accessibilityRole="header" weight="semibold">
                {dues.length === 1 ? 'Payment Due' : `${dues.length} Payments Due`}
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

        {/* The error belongs on both tabs: one request failing leaves neither
            list trustworthy, and saying so only on Joined would let Organised
            look merely empty. */}
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
            description="Collect contributions from a group towards something shared, or join a pool with a code."
            action="Create a pool"
            onAction={props.onCreate}
            secondaryAction="Join with a code"
            onSecondaryAction={props.onJoin}
          />
        ) : null}

        {showingJoined ? (
          <>
            {(props.joined ?? []).map((entry) => (
              <JoinedPoolCard
                key={entry.membershipId}
                pool={entry.pool}
                due={entry.due}
                totals={entry}
                onPress={() => props.onOpenJoined(entry.pool.id)}
              />
            ))}

            {!props.loading && !props.error && !nothingYet && !props.joined?.length ? (
              <AppEmptyState
                icon="people-circle-outline"
                tone="neutral"
                title="No joined pools"
                description="A pool you join with a code appears here, with what you owe towards it."
              />
            ) : null}
          </>
        ) : (
          <>
            {(props.organised ?? []).map((pool) => (
              <OrganisedPoolCard
                key={pool.id}
                pool={pool}
                onPress={() => props.onOpenOrganised(pool.id)}
              />
            ))}

            {!props.loading && !props.error && !nothingYet && !props.organised?.length ? (
              <AppEmptyState
                icon="people-circle-outline"
                tone="neutral"
                title="No organised pools"
                description="A pool you create appears here, with what the group has paid towards it."
              />
            ) : null}
          </>
        )}

        <AppCard onPress={props.onOpenGoals} accessibilityLabel="Open your savings goals">
          <View style={styles.rowBetween}>
            <View style={styles.joinText}>
              <AppText weight="semibold">My savings goals</AppText>
              <AppText style={{ color: colors.textMuted }}>
                Money you are putting aside on your own
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </AppCard>
      </ScrollView>

      <AppFab
        label="Start"
        onPress={() => setSheetOpen(true)}
        bottomOffset={spacing.md}
        testID="akawo-start-fab"
      />

      <AppActionSheet
        visible={sheetOpen}
        title="Start an Akawo pool"
        onClose={() => setSheetOpen(false)}
        actions={[
          {
            label: 'Create',
            description: 'Open a pool and collect from a group',
            icon: 'add-circle-outline',
            onPress: props.onCreate,
          },
          {
            label: 'Join',
            description: 'Enter the code an organiser shared with you',
            icon: 'enter-outline',
            onPress: props.onJoin,
          },
        ]}
        testID="akawo-start-sheet"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

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

  sectionTitle: { fontSize: fontSizes.body },
  joinText: { flex: 1, gap: 2 },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
