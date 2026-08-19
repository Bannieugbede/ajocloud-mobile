import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { inquireAccount, linkBankAccount, listBanks } from '@/api/endpoints/kyc';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppSelect } from '@/components/ui/app-select';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { fontSizes, radius, spacing } from '@/theme';
import { StepScreen } from './step-screen';

const ACCOUNT_NUMBER_LENGTH = 10;

/**
 * Step i. The account name is resolved with the bank and shown for the user to
 * confirm before anything is linked, so a typo cannot silently attach someone
 * else's account.
 */
export function BankAccountStep({ onLinked }: { onLinked: () => void }) {
  const { colors } = useTheme();
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const banksQuery = useQuery({
    queryKey: ['kyc', 'banks'],
    queryFn: listBanks,
    staleTime: 24 * 60 * 60 * 1_000,
  });

  const inquiry = useMutation({
    mutationFn: inquireAccount,
    onSuccess: (result) => setResolvedName(result.accountName),
  });

  const link = useMutation({
    mutationFn: linkBankAccount,
    onSuccess: () => onLinked(),
  });

  const bankOptions = (banksQuery.data?.banks ?? []).map((bank) => ({
    value: bank.code,
    label: bank.name,
  }));

  const ready = bankCode !== null && accountNumber.length === ACCOUNT_NUMBER_LENGTH;

  const resolve = () => {
    if (!ready || !bankCode) return;
    setResolvedName(null);
    inquiry.mutate({ bankCode, accountNumber });
  };

  const confirm = () => {
    if (!bankCode) return;
    link.mutate({ bankCode, accountNumber });
  };

  const error =
    (inquiry.error as AppError | null)?.message ??
    (link.error as AppError | null)?.message ??
    (banksQuery.error as AppError | null)?.message;

  return (
    <StepScreen
      step="bank-account"
      title="Add your bank account"
      description="Payouts and withdrawals go here. The account must be in your own name."
      error={error}
    >
      <View style={styles.form}>
        {banksQuery.isPending ? (
          <View style={styles.loading}>
            <ActivityIndicator accessibilityLabel="Loading banks" color={colors.primary} />
          </View>
        ) : (
          <AppSelect
            label="Bank"
            value={bankCode}
            options={bankOptions}
            onChange={(value) => {
              setBankCode(value);
              // The previous name belongs to a different bank; drop it.
              setResolvedName(null);
            }}
            placeholder="Select your bank"
            searchable
            disabled={link.isPending}
            testID="bank-select"
          />
        )}

        <AppInput
          label="Account number"
          value={accountNumber}
          onChangeText={(text) => {
            setAccountNumber(text.replace(/\D/g, '').slice(0, ACCOUNT_NUMBER_LENGTH));
            setResolvedName(null);
          }}
          keyboardType="number-pad"
          maxLength={ACCOUNT_NUMBER_LENGTH}
          editable={!link.isPending}
          testID="account-number-input"
        />

        {resolvedName ? (
          <View
            accessibilityLiveRegion="polite"
            style={[styles.resolved, { backgroundColor: colors.successSoft }]}
          >
            <Ionicons
              accessibilityElementsHidden
              importantForAccessibility="no"
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <View style={styles.resolvedCopy}>
              <AppText style={[styles.resolvedLabel, { color: colors.textMuted }]}>
                Account name
              </AppText>
              <AppText weight="semibold">{resolvedName}</AppText>
            </View>
          </View>
        ) : null}

        {resolvedName ? (
          <AppButton
            label="This is my account"
            onPress={confirm}
            loading={link.isPending}
            disabled={link.isPending}
          />
        ) : (
          <AppButton
            label="Check account"
            onPress={resolve}
            loading={inquiry.isPending}
            disabled={!ready || inquiry.isPending}
          />
        )}
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  loading: { paddingVertical: spacing.lg },
  resolved: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  resolvedCopy: { flex: 1, gap: spacing.xs },
  resolvedLabel: { fontSize: fontSizes.caption },
});
