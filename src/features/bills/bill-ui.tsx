import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import type { BillCategoryKind } from './bill-catalog-view';
import { providerMark } from './bill-catalog-view';

/**
 * The pieces the four bill screens are built from, so Airtime, Internet,
 * Electricity and Cable TV share one look: a provider badge, sections drawn as
 * cards, tiles for amounts and packages, and an amount line ending in Pay.
 */

type Colors = ReturnType<typeof useTheme>['colors'];

/** Each category's accent, from the theme's semantic tokens. */
export function kindPalette(kind: BillCategoryKind | null, colors: Colors) {
  switch (kind) {
    case 'electricity':
      return { accent: colors.warning, soft: colors.warningSoft };
    case 'cable':
      return { accent: colors.secondary, soft: colors.secondarySoft };
    case 'internet':
      return { accent: colors.info, soft: colors.infoSoft };
    case 'airtime':
      return { accent: colors.success, soft: colors.successSoft };
    default:
      return { accent: colors.primary, soft: colors.primarySoft };
  }
}

export function ProviderBadge({
  name,
  kind,
  size = 44,
}: {
  name: string;
  kind: BillCategoryKind | null;
  size?: number;
}) {
  const { colors } = useTheme();
  const palette = kindPalette(kind, colors);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.badge,
        { backgroundColor: palette.soft, height: size, width: size, borderRadius: size / 2 },
      ]}
    >
      <AppText
        weight="bold"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.badgeText, { color: palette.accent }]}
      >
        {providerMark(name)}
      </AppText>
    </View>
  );
}

/** A titled card, the unit every bill screen is laid out in. */
export function BillSection({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      {title || action ? (
        <View style={styles.sectionHeader}>
          {title ? (
            <AppText accessibilityRole="header" weight="semibold" style={styles.sectionTitle}>
              {title}
            </AppText>
          ) : null}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** "Service provider" with the current choice; tapping opens the full list. */
export function ProviderField({
  label = 'Service provider',
  name,
  kind,
  onPress,
}: {
  label?: string;
  name: string | null;
  kind: BillCategoryKind | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <BillSection title={label}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${name ?? 'not chosen'}. Change`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.providerRow,
          { borderBottomColor: colors.divider, opacity: pressed ? 0.7 : 1 },
        ]}
        testID="bill-provider-field"
      >
        {name ? <ProviderBadge name={name} kind={kind} /> : null}
        <AppText weight="semibold" style={styles.providerName} numberOfLines={1}>
          {name ?? 'Choose a provider'}
        </AppText>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    </BillSection>
  );
}

/**
 * The number being paid for, in the card the references use: a network badge
 * that opens the provider list, beside a large number field.
 */
export function ReferenceHeader({
  providerName,
  kind,
  label,
  value,
  placeholder,
  keyboardType,
  error,
  onChangeText,
  onOpenProviders,
}: {
  providerName: string | null;
  kind: BillCategoryKind | null;
  label: string;
  value: string;
  placeholder: string;
  keyboardType: React.ComponentProps<typeof TextInput>['keyboardType'];
  error?: string | null;
  onChangeText: (value: string) => void;
  onOpenProviders: () => void;
}) {
  const { colors } = useTheme();
  return (
    <BillSection>
      <View
        style={[styles.referenceRow, { borderBottomColor: error ? colors.error : colors.divider }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Network: ${providerName ?? 'not chosen'}. Change`}
          onPress={onOpenProviders}
          hitSlop={spacing.xs}
          style={({ pressed }) => [styles.networkButton, { opacity: pressed ? 0.7 : 1 }]}
          testID="bill-network-button"
        >
          {providerName ? (
            <ProviderBadge name={providerName} kind={kind} size={40} />
          ) : (
            <Ionicons name="cellular-outline" size={28} color={colors.textMuted} />
          )}
          <Ionicons name="caret-down" size={12} color={colors.textMuted} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          autoCorrect={false}
          autoCapitalize="characters"
          style={[styles.referenceInput, { color: colors.text, fontFamily: fontFamilies.semibold }]}
        />
      </View>
      <AppText style={[styles.caption, { color: error ? colors.error : colors.textMuted }]}>
        {error ?? label}
      </AppText>
    </BillSection>
  );
}

/** A labelled number field inside its own card, for meters and smartcards. */
export function ReferenceCard({
  label,
  value,
  placeholder,
  keyboardType,
  error,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  keyboardType: React.ComponentProps<typeof TextInput>['keyboardType'];
  error?: string | null;
  onChangeText: (value: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <BillSection title={label}>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={keyboardType}
        autoCorrect={false}
        autoCapitalize="characters"
        style={[
          styles.cardInput,
          {
            borderBottomColor: error ? colors.error : colors.divider,
            color: colors.text,
            fontFamily: fontFamilies.medium,
          },
        ]}
      />
      {error ? (
        <AppText style={[styles.caption, { color: colors.error }]} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </BillSection>
  );
}

/** A grid of one-tap amounts, three to a row. */
export function AmountTiles({
  amountsMinor,
  selectedMinor,
  onSelect,
}: {
  amountsMinor: readonly string[];
  selectedMinor: string | null;
  onSelect: (amountMinor: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {amountsMinor.map((amountMinor) => {
        const selected = amountMinor === selectedMinor;
        const label = formatMinorAmount(amountMinor, 'NGN').replace(/\.00$/, '');
        return (
          <Pressable
            key={amountMinor}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => onSelect(amountMinor)}
            style={({ pressed }) => [
              styles.tile,
              styles.thirds,
              {
                backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted,
                borderColor: selected ? colors.primary : 'transparent',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <AppText
              weight="bold"
              style={[styles.tileAmount, { color: selected ? colors.primary : colors.text }]}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "₦ ____  [Pay]": a typed amount and the button that carries it forward. */
export function AmountEntry({
  value,
  error,
  payLabel = 'Pay',
  onChangeText,
  onPay,
}: {
  value: string;
  error?: string | null;
  payLabel?: string;
  onChangeText: (value: string) => void;
  onPay: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.entryBlock}>
      <View style={styles.entryRow}>
        <View
          style={[styles.entryField, { borderBottomColor: error ? colors.error : colors.divider }]}
        >
          <AppText weight="bold" style={styles.naira}>
            ₦
          </AppText>
          <TextInput
            accessibilityLabel="Amount (₦)"
            value={value}
            onChangeText={onChangeText}
            placeholder="Enter amount"
            placeholderTextColor={colors.placeholder}
            keyboardType="decimal-pad"
            style={[styles.entryInput, { color: colors.text, fontFamily: fontFamilies.semibold }]}
          />
        </View>
        <AppButton label={payLabel} size="compact" onPress={onPay} />
      </View>
      {error ? (
        <AppText style={[styles.caption, { color: colors.error }]} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

/** A small rounded label, e.g. a package's "30 days". */
export function Pill({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.warningSoft }]}>
      <AppText weight="medium" style={[styles.pillText, { color: colors.warning }]}>
        {children}
      </AppText>
    </View>
  );
}

export const billStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: sizes.touchTarget + 24,
    padding: spacing.sm,
  },
  thirds: { flexBasis: '30%', flexGrow: 1, maxWidth: '33%' },
  halves: { flexBasis: '45%', flexGrow: 1, maxWidth: '50%' },
  caption: { fontSize: fontSizes.caption },
});

const styles = StyleSheet.create({
  ...billStyles,
  badge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: fontSizes.caption },

  section: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: fontSizes.body },

  providerRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget + 8,
    paddingBottom: spacing.sm,
  },
  providerName: { flex: 1, fontSize: fontSizes.body },

  referenceRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  networkButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: sizes.touchTarget,
  },
  divider: { height: 32, width: 1.5 },
  referenceInput: { flex: 1, fontSize: fontSizes.title, minHeight: sizes.touchTarget },

  cardInput: {
    borderBottomWidth: 1,
    fontSize: fontSizes.body,
    minHeight: sizes.touchTarget,
  },

  tileAmount: { fontSize: fontSizes.body },

  entryBlock: { gap: spacing.xs },
  entryRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  entryField: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  naira: { fontSize: fontSizes.title },
  entryInput: { flex: 1, fontSize: fontSizes.body, minHeight: sizes.touchTarget },

  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pillText: { fontSize: fontSizes.caption },
});
