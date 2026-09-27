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
import { AppChipGroup } from '@/components/ui/app-chip-group';
import { AppInput } from '@/components/ui/app-input';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { formatMinorAmount, majorToMinor, minorToMajor } from '@/utils/money';

import { amountError, isFixedAmount, resolveAmountMinor } from './bill-amount';
import {
  normaliseReference,
  quickAmounts,
  referenceKeyboard,
  referencePlaceholder,
  referenceProblem,
} from './bill-reference';
import { categoryIcon, categoryTone, type CategoryTone } from './saved-bills';

/** Up to this many providers are drawn as tiles; more read better as a list. */
const TILE_LIMIT = 6;

/** What a range-priced product accepts, in the few words a row can hold. */
function rangeDescription(product: BillProduct): string {
  if (product.minimumMinor != null && product.maximumMinor != null) {
    return `${formatMinorAmount(product.minimumMinor, product.currency)} – ${formatMinorAmount(product.maximumMinor, product.currency)}`;
  }
  if (product.minimumMinor != null) {
    return `From ${formatMinorAmount(product.minimumMinor, product.currency)}`;
  }
  return 'Any amount';
}

/** The short mark drawn on a provider tile: "MTN", "GLO", "DSTV", "AI". */
export function providerMark(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return (first.length <= 4 ? first : first.slice(0, 2)).toUpperCase();
}

/**
 * Choosing who to pay, what for, and how much.
 *
 * Provider, package, number and amount on one screen, because they are one
 * decision: a data bundle is a network, a plan and a phone number, and the
 * price is only known once the plan is.
 *
 * Continue does not pay. It carries the details to the confirmation, where the
 * number is checked with the provider and the payer sees who it belongs to
 * before any money moves.
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
  const palette = tonePalette(categoryTone(categoryName ?? ''), colors);

  const [billerId, setBillerId] = useState(initialBillerId ?? '');
  const [productId, setProductId] = useState('');
  const [reference, setReference] = useState('');
  const [amountMajor, setAmountMajor] = useState(
    initialAmountMinor ? minorToMajor(initialAmountMinor) : '',
  );
  const [touched, setTouched] = useState(false);

  const biller = billers?.find((candidate) => candidate.id === billerId) ?? null;
  const kind = biller?.referenceKind ?? null;
  const products = biller?.products ?? [];
  const product = products.find((candidate) => candidate.id === productId) ?? null;
  // A biller with exactly one product has nothing to choose, so it is chosen.
  const effectiveProduct = product ?? (products.length === 1 ? (products[0] ?? null) : null);
  // Priced packages (data plans, bouquets) are a list to read; range products
  // (prepaid or postpaid) are a two-way switch.
  const packaged = products.length > 1 && products.every(isFixedAmount);

  const fixed = isFixedAmount(effectiveProduct);
  const amountMinor = resolveAmountMinor(effectiveProduct, amountMajor);
  const amountProblem = amountError(effectiveProduct, amountMinor);
  const referenceIssue = biller ? referenceProblem(kind, reference) : null;
  const productProblem = products.length > 1 && !product;

  const ready = Boolean(biller) && !referenceIssue && !amountProblem && !productProblem;

  const chooseBiller = (next: BillBiller) => {
    setBillerId(next.id);
    // A package from the previous biller means nothing here.
    setProductId('');
    setTouched(false);
  };

  const amountChips = quickAmounts(kind)
    .map((naira) => String(naira))
    .filter((naira) => {
      const minor = majorToMinor(naira);
      return minor !== null && amountError(effectiveProduct, minor) === null;
    });

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
            <Ionicons name={categoryIcon(categoryName)} size={24} color={palette.accent} />
          </View>
        ) : null}

        {loading ? <AppSkeletonCard testID="billers-skeleton" /> : null}

        {error ? (
          <AppErrorState
            title="Could not load providers"
            description="The list of providers could not be loaded. Check your connection and try again."
            onRetry={onRetry}
          />
        ) : null}

        {!loading && !error && !billers?.length ? (
          <AppEmptyState
            icon="business-outline"
            tone="neutral"
            title="No providers here yet"
            description="There is nothing to pay in this category right now. Try another category."
          />
        ) : null}

        {billers?.length ? (
          <>
            <SectionLabel>PROVIDER</SectionLabel>
            {billers.length <= TILE_LIMIT ? (
              <View accessibilityRole="radiogroup" style={styles.tiles}>
                {billers.map((candidate) => (
                  <ProviderTile
                    key={candidate.id}
                    name={candidate.name}
                    tone={palette}
                    selected={candidate.id === billerId}
                    onPress={() => chooseBiller(candidate)}
                  />
                ))}
              </View>
            ) : (
              <View
                accessibilityRole="radiogroup"
                style={[
                  styles.list,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {billers.map((candidate, index) => (
                  <OptionRow
                    key={candidate.id}
                    title={candidate.name}
                    selected={candidate.id === billerId}
                    first={index === 0}
                    onPress={() => chooseBiller(candidate)}
                  />
                ))}
              </View>
            )}

            {biller && products.length > 1 && packaged ? (
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
                    <OptionRow
                      key={candidate.id}
                      title={candidate.name}
                      {...(candidate.validity ? { detail: candidate.validity } : {})}
                      trailing={formatMinorAmount(
                        candidate.fixedAmountMinor ?? '0',
                        candidate.currency,
                      )}
                      selected={candidate.id === productId}
                      first={index === 0}
                      onPress={() => {
                        setProductId(candidate.id);
                        setTouched(false);
                      }}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {biller && products.length > 1 && !packaged ? (
              <>
                <SectionLabel>TYPE</SectionLabel>
                <AppSegmented
                  label={`${biller.name} account type`}
                  options={products.map((candidate) => ({
                    value: candidate.id,
                    label: candidate.name,
                  }))}
                  value={productId}
                  onChange={(next) => {
                    setProductId(next);
                    setTouched(false);
                  }}
                />
                {product ? (
                  <AppText style={[styles.caption, { color: colors.textMuted }]}>
                    {rangeDescription(product)}
                  </AppText>
                ) : null}
              </>
            ) : null}

            {touched && productProblem ? (
              <ErrorLine>
                {packaged ? 'Choose a package.' : 'Choose which kind of account you are paying.'}
              </ErrorLine>
            ) : null}

            {biller ? (
              <>
                <AppInput
                  label={biller.referenceLabel}
                  value={reference}
                  onChangeText={(value) => {
                    setReference(value);
                    setTouched(false);
                  }}
                  placeholder={referencePlaceholder(kind)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  keyboardType={referenceKeyboard(kind)}
                  {...(kind === 'phone' ? { textContentType: 'telephoneNumber' as const } : {})}
                  error={touched && referenceIssue ? referenceIssue : undefined}
                />

                {fixed && effectiveProduct?.fixedAmountMinor ? (
                  <View style={[styles.fixed, { backgroundColor: colors.surfaceMuted }]}>
                    <View style={styles.fixedText}>
                      <AppText style={{ color: colors.textMuted }}>Amount</AppText>
                      {effectiveProduct.validity ? (
                        <AppText style={[styles.caption, { color: colors.textMuted }]}>
                          {effectiveProduct.name} · {effectiveProduct.validity}
                        </AppText>
                      ) : null}
                    </View>
                    <AppText weight="bold">
                      {formatMinorAmount(
                        effectiveProduct.fixedAmountMinor,
                        effectiveProduct.currency,
                      )}
                    </AppText>
                  </View>
                ) : effectiveProduct || products.length === 0 ? (
                  <>
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
                    {amountChips.length ? (
                      <AppChipGroup
                        label="Quick amounts"
                        scroll
                        options={amountChips.map((naira) => ({
                          value: naira,
                          label: formatMinorAmount(majorToMinor(naira) ?? '0', 'NGN'),
                        }))}
                        value={amountMajor}
                        onChange={(naira) => {
                          setAmountMajor(naira);
                          setTouched(false);
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

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
                  customerReference: normaliseReference(kind, reference),
                  amountMinor,
                });
              }}
              // Not disabled: tapping early is how the payer learns which of
              // the fields still needs them.
              disabled={!biller}
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
    <AppText
      accessibilityRole="header"
      weight="semibold"
      style={[styles.sectionLabel, { color: colors.textMuted }]}
    >
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

function ProviderTile({
  name,
  tone,
  selected,
  onPress,
}: {
  name: string;
  tone: { accent: string; soft: string };
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? colors.surfaceMuted : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.mark, { backgroundColor: tone.soft }]}
      >
        <AppText weight="bold" style={[styles.markText, { color: tone.accent }]}>
          {providerMark(name)}
        </AppText>
      </View>
      <AppText
        weight={selected ? 'semibold' : 'regular'}
        style={[styles.tileName, { color: selected ? colors.primary : colors.text }]}
        numberOfLines={2}
      >
        {name}
      </AppText>
    </Pressable>
  );
}

function OptionRow({
  title,
  detail,
  trailing,
  selected,
  first,
  onPress,
}: {
  title: string;
  detail?: string;
  trailing?: string;
  selected: boolean;
  first: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={[title, detail, trailing].filter(Boolean).join('. ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        {
          backgroundColor: selected ? colors.surfaceMuted : 'transparent',
          borderTopColor: colors.divider,
          borderTopWidth: first ? 0 : 1,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={styles.optionText}>
        <AppText
          weight={selected ? 'semibold' : 'regular'}
          style={{ color: selected ? colors.primary : colors.text }}
        >
          {title}
        </AppText>
        {detail ? (
          <AppText style={[styles.caption, { color: colors.textMuted }]}>{detail}</AppText>
        ) : null}
      </View>
      {trailing ? <AppText weight="semibold">{trailing}</AppText> : null}
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={colors.primary}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </Pressable>
  );
}

function tonePalette(tone: CategoryTone, colors: ReturnType<typeof useTheme>['colors']) {
  switch (tone) {
    case 'electricity':
      return { accent: colors.warning, soft: colors.warningSoft };
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
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  sectionLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },
  caption: { fontSize: fontSizes.caption },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    borderRadius: radius.lg,
    // Three across on a phone, allowing for the container padding and gaps.
    flexBasis: '30%',
    flexGrow: 1,
    gap: spacing.xs,
    maxWidth: '33%',
    minHeight: sizes.touchTarget * 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  mark: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  markText: { fontSize: fontSizes.caption },
  tileName: { fontSize: fontSizes.caption, textAlign: 'center' },

  list: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget + 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionText: { flex: 1, gap: 2 },

  fixed: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  fixedText: { flex: 1, gap: 2 },
});
