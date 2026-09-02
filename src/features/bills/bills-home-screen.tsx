import { ScrollView, StyleSheet } from 'react-native';

import type { BillCategory, BillPayment } from '@/api/endpoints/bill-payments';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

/** Icon per category, falling back to something neutral for a new one. */
function categoryIcon(
  name: string,
): 'phone-portrait-outline' | 'flash-outline' | 'tv-outline' | 'water-outline' | 'receipt-outline' {
  const lower = name.toLowerCase();
  if (lower.includes('airtime') || lower.includes('data')) return 'phone-portrait-outline';
  if (lower.includes('electric') || lower.includes('power')) return 'flash-outline';
  if (lower.includes('tv') || lower.includes('cable')) return 'tv-outline';
  if (lower.includes('water')) return 'water-outline';
  return 'receipt-outline';
}

export function BillsHomeScreen({
  categories,
  recent,
  loading,
  error,
  onRetry,
  onOpenCategory,
  onOpenPayment,
}: {
  categories?: BillCategory[];
  recent?: BillPayment[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpenCategory: (category: BillCategory) => void;
  onOpenPayment: (paymentId: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {loading ? (
        <>
          <AppSkeletonCard testID="bills-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {error ? (
        <AppErrorState
          title="Could not load bill payments"
          description="The list of things you can pay could not be loaded. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : null}

      {!loading && !error && !categories?.length ? (
        <AppEmptyState
          icon="receipt-outline"
          title="Nothing to pay yet"
          description="Bill payment categories will appear here once they are available."
        />
      ) : null}

      {categories?.map((category) => (
        <AppListItem
          key={category.id}
          title={category.name}
          icon={categoryIcon(category.name)}
          onPress={() => onOpenCategory(category)}
        />
      ))}

      {recent?.length ? (
        <>
          <AppDivider />
          <AppText accessibilityRole="header" weight="semibold">
            Recent payments
          </AppText>
          {recent.map((payment) => (
            <AppCard
              key={payment.id}
              onPress={() => onOpenPayment(payment.id)}
              accessibilityLabel={`${formatMinorAmount(payment.amountMinor, payment.currency)} to ${payment.customerReferenceMasked}, ${statusLabel(payment.status)}`}
            >
              <AppText weight="semibold">
                {formatMinorAmount(payment.amountMinor, payment.currency)}
              </AppText>
              <AppText style={{ color: colors.textMuted }}>
                {payment.customerReferenceMasked} · {statusLabel(payment.status)}
              </AppText>
            </AppCard>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
});
