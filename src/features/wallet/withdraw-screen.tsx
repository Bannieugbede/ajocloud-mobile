import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import type { LinkedBankAccount } from '@/api/endpoints/kyc';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppEmptyState } from '@/components/ui/app-state';
import { AppInput } from '@/components/ui/app-input';
import { AppSelect } from '@/components/ui/app-select';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, majorToMinor } from '@/utils/money';
import { movementAmountError } from './movement-form';

/**
 * Requesting a payout to a linked bank account.
 *
 * The wording is deliberate throughout: the funds are reserved and the payout
 * is released by an operator, so nothing here says the money has been sent.
 */
export function WithdrawScreen({
  accounts,
  availableMinor,
  currency,
  submitting,
  error,
  onAddAccount,
  onSubmit,
}: {
  accounts: LinkedBankAccount[];
  availableMinor: string | null;
  currency: string;
  submitting: boolean;
  error?: AppError | null;
  onAddAccount: () => void;
  onSubmit: (input: { bankAccountId: string; amountMinor: string; transactionPin: string }) => void;
}) {
  const { colors } = useTheme();
  const [bankAccountId, setBankAccountId] = useState<string | null>(accounts[0]?.id ?? null);
  const [amountMajor, setAmountMajor] = useState('');
  const [pin, setPin] = useState('');
  const [touched, setTouched] = useState(false);

  const amountMinor = majorToMinor(amountMajor);
  const amountProblem = movementAmountError(amountMinor, availableMinor, currency);
  const ready = Boolean(bankAccountId) && !amountProblem && /^\d{4}$/.test(pin);

  if (accounts.length === 0) {
    return (
      <AppEmptyState
        icon="business-outline"
        title="No bank account linked"
        description="Add the account you want to be paid into. We verify the name with your bank before linking it."
        action="Add a bank account"
        onAction={onAddAccount}
      />
    );
  }

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
          <AppText style={{ color: colors.textMuted }}>Available to withdraw</AppText>
          <AppText weight="bold" style={styles.balance}>
            {formatMinorAmount(availableMinor ?? '0', currency)}
          </AppText>
        </AppCard>

        <AppSelect
          label="Pay into"
          value={bankAccountId}
          options={accounts.map((account) => ({
            value: account.id,
            label: `${account.bankName} · ${account.accountMasked}`,
          }))}
          onChange={setBankAccountId}
          searchable={accounts.length > 8}
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
          label="Transaction PIN"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          textContentType="password"
          error={touched && !/^\d{4}$/.test(pin) ? 'Enter your 4-digit PIN.' : undefined}
        />

        <AppText style={{ color: colors.textMuted }}>
          We will hold this amount aside and pay it out to your bank. It leaves your available
          balance straight away, and can take a little while to arrive.
        </AppText>

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Request payout"
          onPress={() => {
            if (!ready || !amountMinor || !bankAccountId) {
              setTouched(true);
              return;
            }
            onSubmit({ bankAccountId, amountMinor, transactionPin: pin });
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
