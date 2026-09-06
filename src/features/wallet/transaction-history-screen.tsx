import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { WalletTransaction } from '@/api/endpoints/wallets';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { MovementRow } from './movement-row';
import {
  MOVEMENT_FILTERS,
  filterMovements,
  settledTotals,
  type MovementFilter,
} from './transaction-history';

/**
 * Everything that has moved through the member's wallet.
 *
 * The two totals count only settled movements, so they always describe money
 * that actually moved. They are deliberately totals of the whole history rather
 * than of the current filter — they are the account's position, not a running
 * sum of whatever is on screen.
 */
export function TransactionHistoryScreen({
  movements,
  currency,
  loading,
  error,
  refreshing,
  onRefresh,
  onRetry,
}: {
  movements?: WalletTransaction[];
  currency: string;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
}) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<MovementFilter>('all');

  const totals = settledTotals(movements);
  const shown = filterMovements(movements, filter);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.totals}>
        <TotalTile
          label="TOTAL IN"
          amountMinor={totals.inMinor}
          currency={currency}
          tone="success"
        />
        <TotalTile
          label="TOTAL OUT"
          amountMinor={totals.outMinor}
          currency={currency}
          tone="error"
        />
      </View>

      <AppSegmented
        label="Filter transactions"
        options={MOVEMENT_FILTERS}
        value={filter}
        onChange={setFilter}
        testID="transaction-filter"
      />

      {loading ? (
        <>
          <AppSkeletonCard testID="transactions-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {error ? (
        <AppErrorState
          title="Could not load your transactions"
          description="Your history could not be refreshed. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : null}

      {!loading && !error && shown.length === 0 ? (
        <AppEmptyState
          icon="receipt-outline"
          title={filter === 'all' ? 'No transactions yet' : 'Nothing to show here'}
          description={
            filter === 'all'
              ? 'Money you add, send, save or spend will appear here.'
              : 'Nothing in your history matches this filter yet.'
          }
          compact
        />
      ) : null}

      {shown.map((movement) => (
        <MovementRow key={movement.id} movement={movement} currency={currency} boxed />
      ))}
    </ScrollView>
  );
}

function TotalTile({
  label,
  amountMinor,
  currency,
  tone,
}: {
  label: string;
  amountMinor: string;
  currency: string;
  tone: 'success' | 'error';
}) {
  const { colors } = useTheme();
  const foreground = tone === 'success' ? colors.success : colors.error;
  const background = tone === 'success' ? colors.successSoft : colors.errorSoft;
  const formatted = formatMinorAmount(amountMinor, currency);

  return (
    <View
      accessible
      accessibilityLabel={`${label.toLowerCase()}, ${formatted}`}
      style={[styles.total, { backgroundColor: background }]}
    >
      <AppText weight="semibold" style={[styles.totalLabel, { color: foreground }]}>
        {label}
      </AppText>
      <AppText weight="bold" style={[styles.totalValue, { color: foreground }]}>
        {formatted}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xxl },
  totals: { flexDirection: 'row', gap: spacing.sm },
  total: { borderRadius: radius.lg, flex: 1, gap: spacing.xs, padding: spacing.md },
  totalLabel: { fontSize: fontSizes.label, letterSpacing: 1 },
  totalValue: { fontSize: fontSizes.body },

  row: { paddingVertical: spacing.sm },
  rowInner: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  glyph: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowText: { flex: 1, gap: 2 },
  rowTrailing: { alignItems: 'flex-end', gap: 2 },
  meta: { fontSize: fontSizes.caption },
});
