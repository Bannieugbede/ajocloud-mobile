import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { AppAmount } from '@/components/ui/app-amount';
import { AppCard } from '@/components/ui/app-card';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { statusLabel } from '@/utils/status';
import { fontSizes, radius, spacing } from '@/theme';

export function AjoListScreen({
  groups,
  loading,
  error,
  onRetry,
  onOpen,
}: {
  groups?: AjoGroupSummary[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpen: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.joinCard, { backgroundColor: colors.primarySoft }]}>
        <Ionicons
          name="key-outline"
          size={22}
          color={colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <View style={styles.flex}>
          <AppText weight="semibold">Join via referral code</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Code lookup is awaiting its backend contract.
          </AppText>
        </View>
      </View>

      {loading ? (
        <>
          <AppSkeletonCard testID="ajo-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {error ? (
        <AppErrorState
          title="Could not load your groups"
          description="Your Ajo groups could not be refreshed. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : null}

      {!loading && !error && !groups?.length ? (
        <AppEmptyState
          icon="people-outline"
          title="No Ajo groups yet"
          description="Groups you create or join will appear here."
        />
      ) : null}

      {groups?.map((group) => (
        <AppCard
          key={group.id}
          onPress={() => onOpen(group.id)}
          accessibilityLabel={`Open ${group.name}`}
        >
          <AppText weight="semibold" style={styles.name}>
            {group.name}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            {statusLabel(group.status)} · {group._count.members} members · {group._count.slots}/
            {group.maxSlots} slots
          </AppText>
          <View style={styles.row}>
            <AppAmount amountMinor={group.baseContributionMinor} currency={group.currency} />
            <AppText style={{ color: colors.textMuted }}>
              {group.contributionFrequency.toLowerCase()}
            </AppText>
          </View>
        </AppCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  joinCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  flex: { flex: 1, gap: spacing.xs },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  name: { flex: 1, fontSize: fontSizes.body },
});
