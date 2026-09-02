import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, majorToMinor } from '@/utils/money';
import { canSend, isPlausibleEmail, movementAmountError } from './movement-form';

/**
 * Sending money to another member.
 *
 * The PIN is asked for on this screen rather than a separate one because the
 * movement settles in a single request: there is no intent to confirm, so a
 * second screen would only add a step.
 */
export function SendMoneyScreen({
  availableMinor,
  currency,
  submitting,
  error,
  onSubmit,
}: {
  availableMinor: string | null;
  currency: string;
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (input: {
    recipientEmail: string;
    amountMinor: string;
    note?: string;
    transactionPin: string;
  }) => void;
}) {
  const { colors } = useTheme();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [touched, setTouched] = useState(false);

  const amountMinor = majorToMinor(amountMajor);
  const amountProblem = movementAmountError(amountMinor, availableMinor, currency);
  const ready = canSend({ recipientEmail, amountMajor, availableMinor }) && /^\d{4}$/.test(pin);

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
        <AppCard>
          <AppText style={{ color: colors.textMuted }}>Available to send</AppText>
          <AppText weight="bold" style={styles.balance}>
            {formatMinorAmount(availableMinor ?? '0', currency)}
          </AppText>
        </AppCard>

        <AppInput
          label="Recipient's email"
          value={recipientEmail}
          onChangeText={setRecipientEmail}
          placeholder="them@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={
            touched && !isPlausibleEmail(recipientEmail)
              ? 'Enter the email address they signed up with.'
              : undefined
          }
        />

        <AppInput
          label="Amount"
          value={amountMajor}
          onChangeText={setAmountMajor}
          placeholder="5000"
          keyboardType="decimal-pad"
          error={touched && amountProblem ? amountProblem : undefined}
        />

        <AppInput
          label="What is it for? (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Lunch"
          autoCapitalize="sentences"
          maxLength={140}
        />

        <AppInput
          label="Transaction PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          // Never written anywhere: it lives in component state for this one
          // request and is cleared when the screen unmounts.
          textContentType="password"
          error={touched && !/^\d{4}$/.test(pin) ? 'Enter your 4-digit PIN.' : undefined}
        />

        <AppText style={{ color: colors.textMuted }}>
          This goes straight to their wallet and cannot be undone.
        </AppText>

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Send money"
          onPress={() => {
            if (!ready || !amountMinor) {
              setTouched(true);
              return;
            }
            const trimmedNote = note.trim();
            onSubmit({
              recipientEmail: recipientEmail.trim(),
              amountMinor,
              ...(trimmedNote ? { note: trimmedNote } : {}),
              transactionPin: pin,
            });
          }}
          loading={submitting}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  balance: { fontSize: fontSizes.title },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
});
