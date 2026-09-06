import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { BillBiller, BillProduct } from '@/api/endpoints/bill-payments';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { formatMinorAmount, majorToMinor, minorToMajor } from '@/utils/money';

import { amountError, isFixedAmount, referenceLabel } from './bill-amount';
import { categoryIcon, categoryTone } from './saved-bills';

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

/**
 * Choosing who to pay, and how much.
 *
 * Provider, reference and amount on one screen, because they are one decision:
 * an electricity payment is a meter and a figure, and splitting them across two
 * screens made the payer commit to a provider before seeing what it would cost.
 *
 * Continue does not pay. It carries the details to the confirmation, where the
 * reference is validated against the biller and the payer sees the verified
 * account name before any money moves.
 */
export function BillerListScreen({
  categoryName,
  billers,
  loading,
  error,
  initialBillerId,
  initialAmountMinor,
  onRetry,
  onContinue,
}: {
  categoryName?: string;
  billers?: BillBiller[];
  loading: boolean;
  error: boolean;
  /** Preselected when repeating a bill the payer has settled before. */
  initialBillerId?: string;
  initialAmountMinor?: string;
  onRetry: () => void;
  onContinue: (input: {
    biller: BillBiller;
    product: BillProduct | null;
    customerReference: string;
    amountMinor: string;
  }) => void;
}) {
  const { colors } = useTheme();
  const palette = tonePalette(categoryName ?? '', colors);

  const [billerId, setBillerId] = useState(initialBillerId ?? '');
  const [productId, setProductId] = useState('');
  const [reference, setReference] = useState('');
  const [amountMajor, setAmountMajor] = useState(
    initialAmountMinor ? minorToMajor(initialAmountMinor) : '',
  );
  const [touched, setTouched] = useState(false);

  const biller = billers?.find((candidate) => candidate.id === billerId) ?? null;
  const products = biller?.products ?? [];
  const product = products.find((candidate) => candidate.id === productId) ?? null;
  // A biller with exactly one product has nothing to choose, so it is chosen.
  const effectiveProduct = product ?? (products.length === 1 ? (products[0] ?? null) : null);

  const fixed = isFixedAmount(effectiveProduct);
  const amountMinor = fixed
    ? (effectiveProduct?.fixedAmountMinor ?? null)
    : majorToMinor(amountMajor);
  const amountProblem = amountError(effectiveProduct, amountMajor);
  const referenceProblem = reference.trim().length < 3;
  const productProblem = products.length > 1 && !product;

  const ready = Boolean(biller) && !referenceProblem && !amountProblem && !productProblem;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {categoryName ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[styles.medallion, { backgroundColor: palette.soft }]}
          >
            <Ionicons name={categoryIcon(categoryName)} size={28} color={palette.accent} />
          </View>
        ) : null}

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
            tone="neutral"
            title="No billers here yet"
            description="There is nothing to pay in this category right now. Try another category."
          />
        ) : null}

        {billers?.length ? (
          <>
            <SectionLabel>PROVIDER</SectionLabel>
            <View
              accessibilityRole="radiogroup"
              style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {billers.map((candidate, index) => (
                <ProviderRow
                  key={candidate.id}
                  name={candidate.name}
                  selected={candidate.id === billerId}
                  first={index === 0}
                  onPress={() => {
                    setBillerId(candidate.id);
                    // A product from the previous biller is meaningless here.
                    setProductId('');
                    setTouched(false);
                  }}
                />
              ))}
            </View>

            {products.length > 1 ? (
              <>
                <SectionLabel>PACKAGE</SectionLabel>
                <View
                  accessibilityRole="radiogroup"
                  style={[
                    styles.list,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  {products.map((candidate, index) => (
                    <ProviderRow
                      key={candidate.id}
                      name={candidate.name}
                      detail={productDescription(candidate)}
                      selected={candidate.id === productId}
                      first={index === 0}
                      onPress={() => {
                        setProductId(candidate.id);
                        setTouched(false);
                      }}
                    />
                  ))}
                </View>
                {touched && productProblem ? (
                  <ErrorLine>Choose which package you are paying for.</ErrorLine>
                ) : null}
              </>
            ) : null}

            <AppInput
              label={referenceLabel(categoryName)}
              value={reference}
              onChangeText={(value) => {
                setReference(value);
                setTouched(false);
              }}
              placeholder="Enter number"
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
              error={
                touched && referenceProblem
                  ? `Enter the ${referenceLabel(categoryName).toLowerCase()} shown on your bill.`
                  : undefined
              }
            />

            {fixed && effectiveProduct?.fixedAmountMinor ? (
              <View style={[styles.fixed, { backgroundColor: colors.surfaceMuted }]}>
                <AppText style={{ color: colors.textMuted }}>Amount</AppText>
                <AppText weight="bold">
                  {formatMinorAmount(effectiveProduct.fixedAmountMinor, effectiveProduct.currency)}
                </AppText>
              </View>
            ) : (
              <AppInput
                label="Amount (₦)"
                value={amountMajor}
                onChangeText={(value) => {
                  setAmountMajor(value);
                  setTouched(false);
                }}
                placeholder="0"
                keyboardType="decimal-pad"
                error={touched ? (amountProblem ?? undefined) : undefined}
              />
            )}

            <AppButton
              label="Continue"
              onPress={() => {
                if (!ready || !biller || !amountMinor) {
                  setTouched(true);
                  return;
                }
                onContinue({
                  biller,
                  product: effectiveProduct,
                  customerReference: reference.trim(),
                  amountMinor,
                });
              }}
              // Disabled rather than erroring: nothing here is a mistake the
              // payer has made, they simply have not finished.
              disabled={!ready}
            />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText weight="semibold" style={[styles.sectionLabel, { color: colors.textMuted }]}>
      {children}
    </AppText>
  );
}

function ErrorLine({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
      {children}
    </AppText>
  );
}

function ProviderRow({
  name,
  detail,
  selected,
  first,
  onPress,
}: {
  name: string;
  detail?: string;
  selected: boolean;
  first: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={detail ? `${name}. ${detail}` : name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.providerRow,
        {
          backgroundColor: selected ? colors.surfaceMuted : 'transparent',
          borderTopColor: colors.divider,
          borderTopWidth: first ? 0 : 1,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.providerText}>
        <AppText
          weight={selected ? 'semibold' : 'regular'}
          style={{ color: selected ? colors.primary : colors.text }}
        >
          {name}
        </AppText>
        {detail ? (
          <AppText style={[styles.providerDetail, { color: colors.textMuted }]}>{detail}</AppText>
        ) : null}
      </View>
      {selected ? (
        <Ionicons
          name="checkmark"
          size={20}
          color={colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </Pressable>
  );
}

function tonePalette(name: string, colors: ReturnType<typeof useTheme>['colors']) {
  switch (categoryTone(name)) {
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

  medallion: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  sectionLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },

  list: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  providerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget + 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  providerText: { flex: 1, gap: 2 },
  providerDetail: { fontSize: fontSizes.caption },

  fixed: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
});
