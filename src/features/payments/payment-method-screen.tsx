import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PaymentIntent, PaymentMethod } from '@/api/endpoints/payments';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppErrorState } from '@/components/ui/app-state';
import { AppHero } from '@/components/ui/app-hero';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

const methods: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    value: 'WALLET',
    label: 'Ajo Cloud wallet',
    description: 'Pay instantly from your balance',
    icon: 'wallet-outline',
  },
  {
    value: 'TRANSFER',
    label: 'Bank transfer',
    description: 'Send to a one-time account number',
    icon: 'swap-horizontal-outline',
  },
  {
    value: 'CARD',
    label: 'Card',
    description: 'Pay with a debit card',
    icon: 'card-outline',
  },
];

/**
 * The shared payment screen. Every product pays through this, so what is being
 * paid for is summarised by the caller and the mechanics stay identical.
 */
export function PaymentMethodScreen({
  title,
  subtitle,
  intent,
  walletAvailableMinor,
  loading,
  error,
  onRetry,
  onContinue,
}: {
  /** What is being paid for, e.g. the pool's name. */
  title: string;
  subtitle?: string;
  intent?: PaymentIntent;
  walletAvailableMinor?: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onContinue: (method: PaymentMethod) => void;
}) {
  const { colors } = useTheme();
  const [method, setMethod] = useState<PaymentMethod>('WALLET');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppSkeletonCard testID="payment-skeleton" />
      </View>
    );
  }

  if (error || !intent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppErrorState
          title="Could not start this payment"
          description="Nothing has been charged. Check your connection and try again."
          onRetry={onRetry}
        />
      </View>
    );
  }

  // Only the wallet can be short of funds; the other rails are funded at the
  // point of payment.
  const walletShort =
    walletAvailableMinor !== undefined && BigInt(walletAvailableMinor) < BigInt(intent.totalMinor);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AppHero
        label="PAYING"
        amountMinor={intent.totalMinor}
        currency={intent.currency}
        meta={[title, subtitle].filter(Boolean).join(' · ')}
      />

      {/* The fee is shown separately rather than folded into one number, so the
          user can see exactly what the platform charges. */}
      {intent.feeMinor !== '0' ? (
        <AppCard tone="muted">
          <View style={styles.breakdownRow}>
            <AppText style={{ color: colors.textMuted }}>Amount</AppText>
            <AppText>{formatMinorAmount(intent.amountMinor, intent.currency)}</AppText>
          </View>
          <View style={styles.breakdownRow}>
            <AppText style={{ color: colors.textMuted }}>Fee</AppText>
            <AppText>{formatMinorAmount(intent.feeMinor, intent.currency)}</AppText>
          </View>
          <AppDivider />
          <View style={styles.breakdownRow}>
            <AppText weight="semibold">Total</AppText>
            <AppText weight="semibold">
              {formatMinorAmount(intent.totalMinor, intent.currency)}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      <AppText accessibilityRole="header" weight="semibold">
        How would you like to pay?
      </AppText>

      {methods.map((option) => {
        const selected = method === option.value;
        const disabled = option.value === 'WALLET' && walletShort;
        return (
          <AppCard
            key={option.value}
            onPress={disabled ? undefined : () => setMethod(option.value)}
            accessibilityLabel={option.label}
            style={[
              styles.method,
              selected && { borderColor: colors.primary },
              disabled && styles.disabled,
            ]}
          >
            <View style={styles.methodRow}>
              <Ionicons
                name={option.icon}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <View style={styles.methodText}>
                <AppText weight="medium">{option.label}</AppText>
                <AppText style={[styles.meta, { color: colors.textMuted }]}>
                  {option.value === 'WALLET' && walletAvailableMinor !== undefined
                    ? disabled
                      ? `Not enough balance — ${formatMinorAmount(walletAvailableMinor, intent.currency)} available`
                      : `${formatMinorAmount(walletAvailableMinor, intent.currency)} available`
                    : option.description}
                </AppText>
              </View>
              {selected ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
            </View>
          </AppCard>
        );
      })}

      <AppButton label="Continue" onPress={() => onContinue(method)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  method: { borderWidth: 2 },
  disabled: { opacity: 0.5 },
  methodRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  methodText: { flex: 1, gap: 2 },
  meta: { fontSize: fontSizes.caption },
});
