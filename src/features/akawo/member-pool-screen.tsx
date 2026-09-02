import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { MemberPoolView } from '@/api/endpoints/akawo-pools';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { statusLabel } from '@/utils/status';

/**
 * What a member sees. It shows their own due and the pool's totals, and
 * deliberately never lists other members' payments — that is the organiser's
 * view, and the API does not return it here.
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

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.hero, { backgroundColor: settled ? colors.success : colors.primary }]}>
        <AppText style={styles.heroLabel}>{settled ? 'YOU HAVE PAID' : 'YOU OWE'}</AppText>
        <AppAmount
          amountMinor={due?.amountMinor ?? pool.amountMinor}
          currency={pool.currency}
          size="heading"
          onInverse
        />
        <AppText style={styles.heroLabel}>{pool.name}</AppText>
      </View>

      {outstanding && !closed ? <AppButton label="Pay now" onPress={onPay} /> : null}

      {outstanding && closed ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText style={{ color: colors.text }}>
            This pool is {pool.status.toLowerCase()}, so it is no longer accepting payments. Speak
            to the organiser.
          </AppText>
        </View>
      ) : null}

      {pool.purpose ? (
        <AppCard>
          <AppText weight="semibold">What this is for</AppText>
          <AppText style={{ color: colors.textMuted }}>{pool.purpose}</AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <AppListItem
          title="Your name in this pool"
          description={membership.fullName}
          showChevron={false}
        />
        <AppListItem
          title={pool.referenceLabel}
          description={membership.reference}
          showChevron={false}
        />
        <AppListItem
          title="Your payment"
          description={due ? statusLabel(due.status) : 'No due recorded'}
          showChevron={false}
        />
      </AppCard>

      <AppCard>
        <AppText weight="semibold">Pool progress</AppText>
        <AppText style={{ color: colors.textMuted }}>
          {data.paidCount} of {data.memberCount} members have paid
        </AppText>
        <AppAmount amountMinor={data.collectedMinor} currency={pool.currency} />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  heroLabel: { color: 'rgba(255,255,255,0.78)', fontSize: fontSizes.caption, letterSpacing: 1.1 },
  notice: { borderRadius: radius.md, padding: spacing.md },
});
