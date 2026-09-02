import { ScrollView, StyleSheet, View } from 'react-native';

import type { BillBiller, BillProduct } from '@/api/endpoints/bill-payments';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

/** What a product costs, in the few words a row can hold. */
function productDescription(product: BillProduct): string {
  if (product.fixedAmountMinor != null) {
    return formatMinorAmount(product.fixedAmountMinor, product.currency);
  }
  if (product.minimumMinor != null && product.maximumMinor != null) {
    return `${formatMinorAmount(product.minimumMinor, product.currency)} – ${formatMinorAmount(product.maximumMinor, product.currency)}`;
  }
  if (product.minimumMinor != null) {
    return `From ${formatMinorAmount(product.minimumMinor, product.currency)}`;
  }
  return 'Any amount';
}

export function BillerListScreen({
  billers,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  billers?: BillBiller[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSelect: (biller: BillBiller, product: BillProduct | null) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {loading ? <AppSkeletonCard testID="billers-skeleton" /> : null}

      {error ? (
        <AppErrorState
          title="Could not load billers"
          description="The list of billers could not be loaded. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : null}

      {!loading && !error && !billers?.length ? (
        <AppEmptyState
          icon="business-outline"
          title="No billers here yet"
          description="There is nothing to pay in this category right now."
        />
      ) : null}

      {billers?.map((biller) => (
        <View key={biller.id}>
          <AppText weight="semibold" style={styles.billerName}>
            {biller.name}
          </AppText>
          {biller.products.length === 0 ? (
            // A biller with no products still takes a payment, with the amount
            // decided entirely by the payer.
            <AppListItem
              title={biller.name}
              description="Any amount"
              onPress={() => onSelect(biller, null)}
            />
          ) : (
            biller.products.map((product) => (
              <AppListItem
                key={product.id}
                title={product.name}
                description={productDescription(product)}
                onPress={() => onSelect(biller, product)}
              />
            ))
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  billerName: { marginTop: spacing.md },
  container: { gap: spacing.xs, padding: spacing.lg, paddingBottom: spacing.xxl },
});
