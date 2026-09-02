import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { PaymentIntent, PaymentMethod } from '@/api/endpoints/payments';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { PIN_LENGTH, PinInput } from '@/features/registration/pin-input';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';

const methodLabels: Record<PaymentMethod, string> = {
  WALLET: 'your Ajo Cloud wallet',
  TRANSFER: 'a bank transfer',
  CARD: 'your card',
};

/**
 * Authorises the payment with the transaction PIN. This is the last screen
 * before money moves, so it restates the amount rather than assuming the user
 * remembers it from the previous step.
 */
export function PaymentConfirmScreen({
  title,
  intent,
  method,
  submitting,
  error,
  onConfirm,
}: {
  title: string;
  intent: PaymentIntent;
  method: PaymentMethod;
  submitting: boolean;
  error?: AppError | null;
  onConfirm: (transactionPin: string) => void;
}) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const complete = pin.length === PIN_LENGTH;

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
        <View style={styles.summary}>
          <AppText style={{ color: colors.textMuted }}>You are paying</AppText>
          <AppAmount amountMinor={intent.totalMinor} currency={intent.currency} size="heading" />
          <AppText style={{ color: colors.textMuted }}>
            for {title} with {methodLabels[method]}
          </AppText>
        </View>

        <PinInput
          label="Enter your transaction PIN"
          value={pin}
          onChange={setPin}
          autoFocus
          editable={!submitting}
          testID="payment-pin"
        />

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
            <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
              {error.message}
            </AppText>
          </View>
        ) : null}

        <AppText style={[styles.hint, { color: colors.textSubtle }]}>
          Your PIN authorises this payment. Ajo Cloud will never ask for it by phone or message.
        </AppText>

        <AppButton
          label="Confirm payment"
          loading={submitting}
          disabled={!complete}
          onPress={() => onConfirm(pin)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  summary: { alignItems: 'center', gap: spacing.xs },
  notice: { borderRadius: radius.md, padding: spacing.md },
  hint: { fontSize: fontSizes.caption, textAlign: 'center' },
});
