import { ScrollView, StyleSheet, View } from 'react-native';

import type { AkawoGoal } from '@/api/endpoints/akawo';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppHero } from '@/components/ui/app-hero';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { sumMinorAmounts } from '@/utils/money';

export function AkawoListScreen({
  goals,
  loading,
  onOpen,
  onOpenPools,
  onCreateGoal,
}: {
  goals?: AkawoGoal[];
  loading: boolean;
  onOpen: (id: string) => void;
  onOpenPools: () => void;
  onCreateGoal: () => void;
}) {
  const { colors } = useTheme();
  const total = sumMinorAmounts(goals?.map((goal) => goal.savedMinor) ?? []);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <AppHero
        label="TOTAL SAVED"
        amountMinor={total}
        meta={`${goals?.length ?? 0} ${goals?.length === 1 ? 'goal' : 'goals'}`}
      />

      <AppCard>
        <AppListItem
          icon="people-circle-outline"
          title="Group pools"
          description="Collect from a group, or pay into one you joined"
          onPress={onOpenPools}
        />
      </AppCard>

      <AppText accessibilityRole="header" weight="semibold">
        Your savings goals
      </AppText>

      <AppButton label="Start a goal" onPress={onCreateGoal} />

      {loading ? (
        <>
          <AppSkeletonCard testID="akawo-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {!loading && !goals?.length ? (
        <AppEmptyState
          icon="wallet-outline"
          title="No Akawo goals yet"
          description="Set aside money towards something, on your own terms."
          action="Start a goal"
          onAction={onCreateGoal}
        />
      ) : null}

      {goals?.map((goal) => (
        <AppCard
          key={goal.id}
          onPress={() => onOpen(goal.id)}
          accessibilityLabel={`Open ${goal.name}`}
        >
          <View style={styles.row}>
            <AppText weight="semibold" style={styles.name}>
              {goal.name}
            </AppText>
            <AppText style={{ color: colors.primary }}>
              {goal.progressBps === null ? 'Flexible' : `${Math.round(goal.progressBps / 100)}%`}
            </AppText>
          </View>
          {goal.progressBps === null ? null : (
            <AppProgress progressBps={goal.progressBps} label={goal.name} showValue={false} />
          )}
          <View style={styles.row}>
            <AppAmount amountMinor={goal.savedMinor} currency={goal.currency} />
            {goal.targetMinor === '0' ? (
              <AppText style={{ color: colors.textMuted }}>Flexible target</AppText>
            ) : (
              <AppAmount
                amountMinor={goal.targetMinor}
                currency={goal.currency}
                size="caption"
                style={{ color: colors.textMuted }}
              />
            )}
          </View>
          <AppText style={{ color: colors.textMuted }}>
            {goal.type.toLowerCase()} · {goal.status.toLowerCase()}
          </AppText>
        </AppCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  name: { flex: 1, fontSize: fontSizes.body },
});
