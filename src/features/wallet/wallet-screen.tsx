import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { WalletSummary, WalletTransaction } from '@/api/endpoints/wallets';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppHero } from '@/components/ui/app-hero';
import { AppSection } from '@/components/ui/app-section';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { MovementRow } from './movement-row';

/** How many recent movements the wallet shows before sending you to the history. */
const RECENT_LIMIT = 5;

/**
 * The wallet: what is spendable, what is on its way out, and what to do next.
 *
 * Distinct from Transaction History, which answers "where did it go?". This one
 * answers "what have I got?", so it leads with the balance and the three
 * actions, and shows only enough recent activity to confirm the last thing that
 * happened.
 */
export function WalletScreen({
  summary,
  movements,
  loading,
  error,
  refreshing,
  onRefresh,
  onRetry,
  onFund,
  onSend,
  onWithdraw,
  onOpenHistory,
}: {
  summary?: WalletSummary;
  movements?: WalletTransaction[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onFund: () => void;
  onSend: () => void;
  onWithdraw: () => void;
  onOpenHistory: () => void;
}) {
  const { colors } = useTheme();
  const currency = summary?.currency ?? 'NGN';
  const recent = (movements ?? []).slice(0, RECENT_LIMIT);

  // Shown because a withdrawal moves funds here: without it the available
  // balance appears to drop with the money nowhere.
  const reserved = summary?.reservedMinor ?? '0';
  const hasReserved = reserved !== '0';

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppSkeletonCard testID="wallet-skeleton" />
        <AppSkeletonCard />
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppErrorState
          title="Could not load your wallet"
          description="Your balance could not be refreshed. Check your connection and try again."
          onRetry={onRetry}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <AppHero
        testID="wallet-hero"
        label="AVAILABLE BALANCE"
        amountMinor={summary.availableMinor}
        currency={currency}
        meta={hasReserved ? `${formatMinorAmount(reserved, currency)} on its way out` : undefined}
      />

      <View style={styles.actions}>
        {/* First, because sending and withdrawing both need a funded wallet and
            this is the only way to fund one. */}
        <AppButton label="Add money" icon="add" onPress={onFund} style={styles.action} />
        <AppButton
          label="Send"
          icon="arrow-forward-outline"
          variant="outline"
          onPress={onSend}
          style={styles.action}
        />
        <AppButton
          label="Withdraw"
          icon="arrow-down-outline"
          variant="outline"
          onPress={onWithdraw}
          style={styles.action}
        />
      </View>

      <AppSection
        title="RECENT ACTIVITY"
        action={
          recent.length ? (
            <AppButton label="See all" variant="ghost" size="compact" onPress={onOpenHistory} />
          ) : null
        }
      >
        {/* The empty state carries no action of its own: "Add money" is already
            the first button above, and the same button twice on one screen is
            not a choice the member actually has. */}
        {recent.length === 0 ? (
          <AppEmptyState
            icon="receipt-outline"
            title="No activity yet"
            description="Money you add, send or spend will show up here."
            compact
          />
        ) : (
          <AppCard>
            {recent.map((movement, index) => (
              <View key={movement.id}>
                {index > 0 ? <AppDivider /> : null}
                <MovementRow movement={movement} currency={currency} />
              </View>
            ))}
          </AppCard>
        )}
      </AppSection>

      {hasReserved ? (
        <AppText style={[styles.footnote, { color: colors.textSubtle }]}>
          Money on its way out is held while a withdrawal settles. It leaves your available balance
          straight away so you cannot spend it twice.
        </AppText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  footnote: { fontSize: fontSizes.caption },
});
