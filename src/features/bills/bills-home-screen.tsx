import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { BillCategory, BillPayment } from '@/api/endpoints/bill-payments';
import { AppCard } from '@/components/ui/app-card';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { shortDate } from '@/utils/dates';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  categoryIcon,
  categoryTone,
  recentPayments,
  referenceLabel,
  savedBills,
  type CategoryTone,
  type SavedBill,
} from './saved-bills';

export function BillsHomeScreen({
  categories,
  recent,
  loading,
  error,
  onRetry,
  onOpenCategory,
  onOpenPayment,
  onQuickPay,
}: {
  categories?: BillCategory[];
  recent?: BillPayment[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpenCategory: (category: BillCategory) => void;
  onOpenPayment: (paymentId: string) => void;
  /** Repeats a bill the member has paid before. */
  onQuickPay: (bill: SavedBill) => void;
}) {
  const { colors } = useTheme();
  const saved = savedBills(recent);
  const history = recentPayments(recent);

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
          tone="neutral"
          title="Nothing to pay yet"
          description="Airtime, data, electricity and TV will appear here once they are available."
        />
      ) : null}

      {categories?.length ? (
        <View style={styles.section}>
          <SectionLabel>CATEGORIES</SectionLabel>
          <View style={styles.grid}>
            {categories.map((category) => (
              <CategoryTile
                key={category.id}
                name={category.name}
                onPress={() => onOpenCategory(category)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {saved.length ? (
        <View style={styles.section}>
          <SectionLabel>SAVED BILLS</SectionLabel>
          {saved.map((bill) => (
            <SavedBillRow key={bill.paymentId} bill={bill} onPress={() => onQuickPay(bill)} />
          ))}
        </View>
      ) : null}

      {history.length ? (
        <View style={styles.section}>
          <SectionLabel>RECENT</SectionLabel>
          {history.map((payment) => (
            <RecentRow
              key={payment.id}
              payment={payment}
              onPress={() => onOpenPayment(payment.id)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText
      accessibilityRole="header"
      weight="semibold"
      style={[styles.sectionLabel, { color: colors.textMuted }]}
    >
      {children}
    </AppText>
  );
}

/**
 * The palette a category is drawn in.
 *
 * Colour is the fastest way to find the row you want in a grid of eight, and
 * the same mapping drives the saved-bill and recent rows so the three sections
 * cannot disagree about what Electricity looks like.
 */
function tonePalette(tone: CategoryTone, colors: ReturnType<typeof useTheme>['colors']) {
  switch (tone) {
    case 'electricity':
      return { accent: colors.warning, soft: colors.warningSoft };
    case 'water':
      return { accent: colors.info, soft: colors.infoSoft };
    case 'tv':
      return { accent: colors.secondary, soft: colors.secondarySoft };
    case 'internet':
      return { accent: colors.info, soft: colors.infoSoft };
    case 'phone':
      return { accent: colors.success, soft: colors.successSoft };
    default:
      return { accent: colors.primary, soft: colors.primarySoft };
  }
}

function CategoryTile({ name, onPress }: { name: string; onPress: () => void }) {
  const { colors } = useTheme();
  const palette = tonePalette(categoryTone(name), colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pay ${name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.tileIcon, { backgroundColor: palette.soft }]}
      >
        <Ionicons name={categoryIcon(name)} size={20} color={palette.accent} />
      </View>
      <AppText weight="semibold" style={styles.tileName} numberOfLines={2}>
        {name}
      </AppText>
    </Pressable>
  );
}

function SavedBillRow({ bill, onPress }: { bill: SavedBill; onPress: () => void }) {
  const { colors } = useTheme();
  const palette = tonePalette(categoryTone(bill.categoryName), colors);

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Pay ${bill.billerName} again, ${formatMinorAmount(
        bill.amountMinor,
        bill.currency,
      )}, ${referenceLabel(bill.categoryName)} ${bill.referenceMasked}`}
      style={styles.row}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.rowIcon, { backgroundColor: palette.soft }]}
      >
        <Ionicons name={categoryIcon(bill.categoryName)} size={20} color={palette.accent} />
      </View>
      <View style={styles.rowText}>
        <AppText weight="bold">{bill.billerName}</AppText>
        <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
          {referenceLabel(bill.categoryName)} {bill.referenceMasked}
        </AppText>
      </View>
      <View style={styles.rowTrailing}>
        <AppText weight="bold">{formatMinorAmount(bill.amountMinor, bill.currency)}</AppText>
        {/* The whole row is the button; this names what tapping it does rather
            than being a second control the row would then need to separate. */}
        <AppText weight="semibold" style={[styles.quickPay, { color: colors.primary }]}>
          Quick Pay
        </AppText>
      </View>
    </AppCard>
  );
}

function RecentRow({ payment, onPress }: { payment: BillPayment; onPress: () => void }) {
  const { colors } = useTheme();
  const name = payment.biller?.category.name ?? '';
  const palette = tonePalette(categoryTone(name), colors);
  const succeeded = payment.status === 'SUCCESSFUL';
  const failed = payment.status === 'FAILED';

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`${payment.biller?.name ?? 'Payment'}, ${formatMinorAmount(
        payment.amountMinor,
        payment.currency,
      )}, ${statusLabel(payment.status)}`}
      style={styles.row}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.rowIcon, { backgroundColor: palette.soft }]}
      >
        <Ionicons name={categoryIcon(name)} size={20} color={palette.accent} />
      </View>
      <View style={styles.rowText}>
        <AppText weight="bold" numberOfLines={1}>
          {payment.biller?.name ?? 'Bill payment'}
        </AppText>
        <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
          {shortDate(payment.createdAt)}
          {payment.biller ? ` · ${payment.biller.category.name}` : ''}
        </AppText>
      </View>
      <View style={styles.rowTrailing}>
        {/* Signed, because a bill payment leaves the wallet and the sign is the
            fastest way to read that without parsing the label. */}
        <AppText weight="bold">−{formatMinorAmount(payment.amountMinor, payment.currency)}</AppText>
        <AppText
          weight="semibold"
          style={[
            styles.status,
            { color: succeeded ? colors.success : failed ? colors.error : colors.textMuted },
          ]}
        >
          {statusLabel(payment.status).toLowerCase()}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    // Four across on a phone, allowing for the container padding and the gaps.
    flexBasis: '22%',
    flexGrow: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  tileIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  tileName: { fontSize: fontSizes.caption, textAlign: 'center' },

  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  rowIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rowText: { flex: 1, gap: 2 },
  rowTrailing: { alignItems: 'flex-end', gap: 2 },
  quickPay: { fontSize: fontSizes.caption },
  status: { fontSize: fontSizes.caption },
});
