import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppKeyboardScrollView } from '@/components/ui/app-keyboard';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PaymentIntent, PaymentMethod } from '@/api/endpoints/payments';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppHero } from '@/components/ui/app-hero';
import { AppInput } from '@/components/ui/app-input';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount, majorToMinor } from '@/utils/money';

import { partAmountMessage, partAmountProblem, walletShortfallMinor } from './payment-flow';
import { methodsFor } from './payment-targets';

type MethodOption = {
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const METHODS: Record<PaymentMethod, MethodOption> = {
  WALLET: {
    label: 'Ajo Cloud wallet',
    description: 'Pay instantly from your balance',
    icon: 'wallet-outline',
  },
  TRANSFER: {
    label: 'Bank transfer',
    description: 'Send to a one-time account number',
    icon: 'swap-horizontal-outline',
  },
  CARD: {
    label: 'Card',
    description: 'Pay with a debit card',
    icon: 'card-outline',
  },
};

/**
 * The first screen of every payment, whichever product it is for: what is
 * being paid, how much, and how.
 *
 * Nothing here is product-specific. The server quotes the amount and says which
 * methods the payment accepts; the caller supplies the words. A product payment
 * that the wallet cannot cover offers a top-up in place, so a short balance is
 * a step on the way rather than a dead end.
 */
export function PaymentMethodScreen({
  title,
  subtitle,
  intent,
  walletAvailableMinor,
  loading,
  error,
  owedMinor,
  updatingAmount = false,
  onRetry,
  onChangeAmount,
  onTopUp,
  onContinue,
}: {
  /** What is being paid for, e.g. the pool's name. */
  title: string;
  subtitle?: string;
  intent?: PaymentIntent;
  walletAvailableMinor?: string;
  loading: boolean;
  error: boolean;
  /**
   * Everything still owed, for a payment that may be made in part. Absent for
   * one that must be paid in full, which hides the choice entirely.
   */
  owedMinor?: string;
  /** A new quote is being fetched for a changed amount. */
  updatingAmount?: boolean;
  onRetry: () => void;
  /** Asks for a new quote: part of what is owed, or null for all of it. */
  onChangeAmount?: (amountMinor: string | null) => void;
  /** Pauses this payment to add `amountMinor` to the wallet first. */
  onTopUp?: (amountMinor: string) => void;
  onContinue: (method: PaymentMethod) => void;
}) {
  const { colors } = useTheme();
  const [chosen, setChosen] = useState<PaymentMethod | null>(null);
  const [editingAmount, setEditingAmount] = useState(false);
  const [partAmount, setPartAmount] = useState('');
  const [partTouched, setPartTouched] = useState(false);

  if (loading && !intent) {
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

  const methods = methodsFor(intent);
  const shortfall = methods.includes('WALLET')
    ? walletShortfallMinor(walletAvailableMinor, intent.totalMinor)
    : null;
  const unavailable = (method: PaymentMethod) => method === 'WALLET' && shortfall !== null;
  const firstAvailable = methods.find((method) => !unavailable(method)) ?? null;
  // The member's choice while it is still possible; otherwise the first method
  // that is. Derived rather than stored, so a quote that changes the total
  // cannot leave a method selected that no longer covers it.
  const method = chosen && !unavailable(chosen) ? chosen : firstAvailable;

  const payingPart = owedMinor !== undefined && intent.amountMinor !== owedMinor;
  const partProblem =
    owedMinor !== undefined ? partAmountProblem(partAmount, owedMinor) : ('empty' as const);
  const partMessage =
    owedMinor !== undefined && partProblem && (partTouched || partProblem !== 'empty')
      ? partAmountMessage(partProblem, formatMinorAmount(owedMinor, intent.currency))
      : null;

  return (
    <AppKeyboardScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <AppHero
        label="PAYING"
        amountMinor={intent.totalMinor}
        currency={intent.currency}
        meta={[title, subtitle].filter(Boolean).join(' · ')}
      />

      {owedMinor !== undefined && onChangeAmount ? (
        <AppCard tone="muted" style={styles.amountCard}>
          <View style={styles.breakdownRow}>
            <AppText style={{ color: colors.textMuted }}>Still owed</AppText>
            <AppText weight="semibold">{formatMinorAmount(owedMinor, intent.currency)}</AppText>
          </View>

          {editingAmount ? (
            <View style={styles.partForm}>
              <AppInput
                label="How much would you like to pay now?"
                value={partAmount}
                onChangeText={setPartAmount}
                keyboardType="decimal-pad"
                autoFocus
                error={partMessage ?? undefined}
                testID="payment-part-amount"
              />
              <View style={styles.inlineActions}>
                <AppButton
                  label="Use this amount"
                  loading={updatingAmount}
                  disabled={updatingAmount}
                  onPress={() => {
                    setPartTouched(true);
                    const minor = majorToMinor(partAmount.trim());
                    if (partProblem || minor === null) return;
                    setEditingAmount(false);
                    // Paying everything is not a part payment: ask for the
                    // whole debt, so the quote reads the owed amount itself.
                    onChangeAmount(minor === owedMinor ? null : minor);
                  }}
                  style={styles.grow}
                />
                <AppButton
                  label="Cancel"
                  variant="ghost"
                  disabled={updatingAmount}
                  onPress={() => setEditingAmount(false)}
                />
              </View>
            </View>
          ) : (
            <View style={styles.inlineActions}>
              <AppText style={[styles.meta, styles.grow, { color: colors.textMuted }]}>
                {payingPart
                  ? `Paying ${formatMinorAmount(intent.amountMinor, intent.currency)} now. The rest stays owed.`
                  : 'You can pay part of it now and the rest later.'}
              </AppText>
              <AppButton
                label={payingPart ? 'Pay all' : 'Pay part'}
                variant="ghost"
                loading={updatingAmount}
                disabled={updatingAmount}
                onPress={() => {
                  if (payingPart) {
                    onChangeAmount(null);
                    return;
                  }
                  setPartAmount('');
                  setPartTouched(false);
                  setEditingAmount(true);
                }}
              />
            </View>
          )}
        </AppCard>
      ) : null}

      {/* The fee is shown separately rather than folded into one number, so
            the member can see exactly what the platform charges. */}
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
        {methods.length > 1 ? 'How would you like to pay?' : 'Paying with'}
      </AppText>

      {methods.map((option) => {
        const details = METHODS[option];
        const selected = method === option;
        const disabled = unavailable(option);
        return (
          <AppCard
            key={option}
            onPress={disabled ? undefined : () => setChosen(option)}
            accessibilityLabel={details.label}
            style={[
              styles.method,
              { borderColor: selected ? colors.primary : colors.border },
              disabled && styles.disabled,
            ]}
          >
            <View style={styles.methodRow}>
              <Ionicons
                name={details.icon}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <View style={styles.methodText}>
                <AppText weight="medium">{details.label}</AppText>
                <AppText style={[styles.meta, { color: colors.textMuted }]}>
                  {option === 'WALLET' && walletAvailableMinor !== undefined
                    ? `${formatMinorAmount(walletAvailableMinor, intent.currency)} available`
                    : details.description}
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

      {/* Standing state rather than a toast: it stays true, and actionable,
            for as long as the member is on this screen. */}
      {shortfall !== null ? (
        <View
          style={[styles.notice, { backgroundColor: colors.warningSoft }]}
          testID="payment-shortfall"
        >
          <AppText weight="semibold" accessibilityLiveRegion="polite">
            Your wallet is {formatMinorAmount(shortfall, intent.currency)} short
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            Add money to your wallet, then come back to finish this payment. It will be waiting for
            you.
          </AppText>
          {onTopUp ? (
            <AppButton label="Add money" variant="outline" onPress={() => onTopUp(shortfall)} />
          ) : null}
        </View>
      ) : null}

      <AppButton
        label="Continue"
        disabled={method === null || updatingAmount}
        onPress={() => {
          if (method) onContinue(method);
        }}
      />
    </AppKeyboardScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  amountCard: { gap: spacing.sm },
  partForm: { gap: spacing.sm },
  inlineActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  method: { borderWidth: 2 },
  disabled: { opacity: 0.5 },
  methodRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  methodText: { flex: 1, gap: 2 },
  meta: { fontSize: fontSizes.caption },
  notice: { borderRadius: radius.md, gap: spacing.sm, padding: spacing.md },
});
