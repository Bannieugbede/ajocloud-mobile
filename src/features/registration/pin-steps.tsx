import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { setTransactionPin } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { PIN_LENGTH, PinInput } from './pin-input';
import { StepScreen } from './step-screen';

/**
 * Rejected client-side as well as on the server, so the obvious choices are
 * refused before a round trip rather than after one.
 */
function describeWeakPin(pin: string): string | undefined {
  if (new Set(pin).size === 1) return 'Avoid a PIN that repeats one digit';
  const digits = [...pin].map(Number);
  const step = (offset: number) =>
    digits.every((digit, index) => index === 0 || digit === (digits[index - 1] as number) + offset);
  if (step(1) || step(-1)) return 'Avoid a PIN that runs in sequence';
  return undefined;
}

export function CreatePinStep({ onChosen }: { onChosen: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();

  const submit = () => {
    const weak = describeWeakPin(pin);
    if (weak) {
      setError(weak);
      return;
    }
    setError(undefined);
    onChosen(pin);
  };

  return (
    <StepScreen
      step="create-pin"
      title="Create a transaction PIN"
      description="You'll use this 4-digit PIN to approve payments and withdrawals. Keep it private — Ajo Cloud will never ask for it."
    >
      <View style={styles.form}>
        <PinInput
          label="New PIN"
          value={pin}
          onChange={(next) => {
            setPin(next);
            setError(undefined);
          }}
          error={error}
          autoFocus
          testID="create-pin-input"
        />
        <AppButton label="Continue" disabled={pin.length !== PIN_LENGTH} onPress={submit} />
      </View>
    </StepScreen>
  );
}

export function ConfirmPinStep({
  chosenPin,
  onConfirmed,
  onRestart,
}: {
  chosenPin: string;
  onConfirmed: () => void;
  onRestart: () => void;
}) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const mutation = useMutation({
    mutationFn: setTransactionPin,
    onSuccess: () => onConfirmed(),
  });

  const submit = () => {
    if (pin !== chosenPin) {
      setMismatch(true);
      setPin('');
      return;
    }
    setMismatch(false);
    mutation.mutate({ pin });
  };

  return (
    <StepScreen
      step="confirm-pin"
      title="Confirm your PIN"
      description="Enter the same 4 digits again so we know it was not a slip."
      error={(mutation.error as AppError | null)?.message}
      footer={
        <AppButton
          label="Choose a different PIN"
          variant="ghost"
          disabled={mutation.isPending}
          onPress={onRestart}
        />
      }
    >
      <View style={styles.form}>
        <PinInput
          label="Confirm PIN"
          value={pin}
          onChange={(next) => {
            setPin(next);
            setMismatch(false);
          }}
          error={mismatch ? 'Those PINs do not match' : undefined}
          editable={!mutation.isPending}
          autoFocus
          testID="confirm-pin-input"
        />
        <AppText style={[styles.hint, { color: colors.textSubtle }]}>
          Your PIN is stored securely and can be changed later from your profile.
        </AppText>
        <AppButton
          label="Save PIN"
          loading={mutation.isPending}
          disabled={pin.length !== PIN_LENGTH}
          onPress={submit}
        />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  hint: { lineHeight: 20 },
});
