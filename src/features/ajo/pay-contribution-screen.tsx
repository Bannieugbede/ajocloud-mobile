import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, majorToMinor } from '@/utils/money';

/**
 * Pays one contribution from the member's wallet.
 *
 * Part payment is offered rather than hidden: flexible groups collect in whole
 * units, so owing part of a round is an ordinary state, and a member who can
 * pay some of it now should not have to wait until they can pay all of it.
 */
export function PayContributionScreen({
  groupName,
  sequence,
  amountDueMinor,
  amountPaidMinor,
  currency,
  submitting,
  error,
  onSubmit,
}: {
  groupName: string;
  sequence: number;
  amountDueMinor: string;
  amountPaidMinor: string;
  currency: string;
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (amountMinor: string) => void;
}) {
  const { colors } = useTheme();

  const remainingMinor = (BigInt(amountDueMinor) - BigInt(amountPaidMinor)).toString();
  const [payingPart, setPayingPart] = useState(false);
  const [partAmount, setPartAmount] = useState('');
  const [touched, setTouched] = useState(false);

  const partMinor = majorToMinor(partAmount.trim());
  const partValid =
    partMinor !== null && BigInt(partMinor) > 0n && BigInt(partMinor) <= BigInt(remainingMinor);

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
          <AppText weight="semibold">{groupName}</AppText>
          <AppText style={{ color: colors.textMuted }}>Round {sequence}</AppText>
          <AppText weight="bold" style={styles.amount}>
            {formatMinorAmount(remainingMinor, currency)}
          </AppText>
          {BigInt(amountPaidMinor) > 0n ? (
            <AppText style={{ color: colors.textMuted }}>
              {formatMinorAmount(amountPaidMinor, currency)} of{' '}
              {formatMinorAmount(amountDueMinor, currency)} already paid
            </AppText>
          ) : null}
        </AppCard>

        <AppText style={{ color: colors.textMuted }}>
          This comes out of your wallet balance. Nothing leaves the group until every member has
          paid this round.
        </AppText>

        {payingPart ? (
          <View style={styles.part}>
            <AppInput
              label={`Amount (up to ${formatMinorAmount(remainingMinor, currency)})`}
              value={partAmount}
              onChangeText={setPartAmount}
              keyboardType="decimal-pad"
              error={
                touched && !partValid
                  ? 'Enter an amount between zero and what is still owed.'
                  : undefined
              }
            />
            <AppButton
              label="Pay this amount"
              loading={submitting}
              disabled={submitting}
              onPress={() => {
                if (!partValid || partMinor === null) {
                  setTouched(true);
                  return;
                }
                onSubmit(partMinor);
              }}
            />
            <AppButton
              label="Cancel"
              variant="secondary"
              disabled={submitting}
              onPress={() => setPayingPart(false)}
            />
          </View>
        ) : (
          <View style={styles.part}>
            <AppButton
              label={`Pay ${formatMinorAmount(remainingMinor, currency)}`}
              loading={submitting}
              disabled={submitting}
              onPress={() => onSubmit(remainingMinor)}
            />
            <AppButton
              label="Pay part of it"
              variant="secondary"
              disabled={submitting}
              onPress={() => setPayingPart(true)}
            />
          </View>
        )}

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 28, lineHeight: 34 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
  part: { gap: spacing.sm },
});
