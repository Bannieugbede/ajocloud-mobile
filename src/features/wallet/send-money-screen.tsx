import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppKeyboardScrollView } from '@/components/ui/app-keyboard';

import { AppBottomSheet } from '@/components/ui/app-bottom-sheet';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useErrorToast } from '@/hooks/use-toast-on-change';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, majorToMinor } from '@/utils/money';
import { canSend, isPlausibleEmail, movementAmountError } from './movement-form';

type PendingTransfer = {
  recipientEmail: string;
  amountMinor: string;
  note?: string;
};

/**
 * Sending money to another member, in three steps.
 *
 * The form takes whom and how much; a confirmation sheet states the transfer
 * back with the balance it will come from; and the transaction PIN — the
 * backend's authorisation for the movement — is the last thing asked, in its
 * own sheet, so a PIN is never typed beside the details it approves.
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
  useErrorToast(error?.message);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [stage, setStage] = useState<'form' | 'confirm' | 'pin'>('form');
  const [pending, setPending] = useState<PendingTransfer | null>(null);
  const [pin, setPin] = useState('');
  const [pinTouched, setPinTouched] = useState(false);

  const amountMinor = majorToMinor(amountMajor);
  const amountProblem = movementAmountError(amountMinor, availableMinor, currency);
  const ready = canSend({ recipientEmail, amountMajor, availableMinor });
  const pinValid = /^\d{4}$/.test(pin);

  const openConfirm = () => {
    if (!ready || !amountMinor) {
      setTouched(true);
      return;
    }
    const trimmedNote = note.trim();
    setPending({
      recipientEmail: recipientEmail.trim(),
      amountMinor,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    });
    setStage('confirm');
  };

  const closeSheets = () => {
    setStage('form');
    setPending(null);
    // Never kept around: the PIN lives for the one request it authorises.
    setPin('');
    setPinTouched(false);
  };

  const submitWithPin = () => {
    if (!pending) return;
    if (!pinValid) {
      setPinTouched(true);
      return;
    }
    onSubmit({ ...pending, transactionPin: pin });
  };

  return (
    <>
      <AppKeyboardScrollView
        style={styles.flex}
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

        <AppText style={{ color: colors.textMuted }}>
          This goes straight to their wallet and cannot be undone.
        </AppText>

        <AppButton label="Send money" onPress={openConfirm} />
      </AppKeyboardScrollView>

      <AppBottomSheet
        visible={stage === 'confirm' && pending !== null}
        title="Confirm transfer"
        onClose={closeSheets}
        testID="send-confirm-sheet"
      >
        {pending ? (
          <ConfirmBody
            pending={pending}
            availableMinor={availableMinor}
            currency={currency}
            onContinue={() => setStage('pin')}
          />
        ) : null}
      </AppBottomSheet>

      <AppBottomSheet
        visible={stage === 'pin' && pending !== null}
        title="Transaction PIN"
        onClose={closeSheets}
        testID="send-pin-sheet"
      >
        {pending ? (
          <>
            <AppText style={{ color: colors.textMuted }}>
              Enter your 4-digit PIN to send {formatMinorAmount(pending.amountMinor, currency)} to{' '}
              {pending.recipientEmail}. This is the last step.
            </AppText>
            <AppInput
              label="Transaction PIN"
              value={pin}
              onChangeText={(value) => {
                setPin(value);
                setPinTouched(false);
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              // Never written anywhere: it lives in component state for this
              // one request and is cleared when the sheets close.
              textContentType="password"
              autoFocus
              error={pinTouched && !pinValid ? 'Enter your 4-digit PIN.' : undefined}
              testID="send-pin-input"
            />
            <AppButton
              label={`Send ${formatMinorAmount(pending.amountMinor, currency)}`}
              onPress={submitWithPin}
              loading={submitting}
              disabled={submitting}
            />
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

/**
 * The transfer stated back before anything moves.
 *
 * The balance is shown beside the amount with whether it covers it, because
 * that is the question being answered — and when it does not cover it, the
 * sheet says so and goes no further rather than asking for a PIN first.
 */
function ConfirmBody({
  pending,
  availableMinor,
  currency,
  onContinue,
}: {
  pending: PendingTransfer;
  availableMinor: string | null;
  currency: string;
  onContinue: () => void;
}) {
  const { colors } = useTheme();
  const covered = availableMinor === null || BigInt(pending.amountMinor) <= BigInt(availableMinor);

  return (
    <>
      <DetailRow label="To" value={pending.recipientEmail} />
      <DetailRow label="Amount" value={formatMinorAmount(pending.amountMinor, currency)} strong />
      {pending.note ? <DetailRow label="Note" value={pending.note} /> : null}
      <DetailRow label="Your balance" value={formatMinorAmount(availableMinor ?? '0', currency)} />
      {covered ? (
        <AppText style={{ color: colors.textMuted }}>Your balance covers this transfer.</AppText>
      ) : (
        <AppText weight="semibold" style={{ color: colors.error }}>
          You have {formatMinorAmount(availableMinor ?? '0', currency)} available. Reduce the amount
          to continue.
        </AppText>
      )}
      <AppButton label="Continue" onPress={onContinue} disabled={!covered} />
    </>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.detailRow}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight={strong ? 'bold' : 'semibold'} style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  balance: { fontSize: fontSizes.title },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  detailValue: { flexShrink: 1, textAlign: 'right' },
});
