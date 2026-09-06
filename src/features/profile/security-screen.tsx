import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppSection } from '@/components/ui/app-section';
import { AppText } from '@/components/ui/app-text';
import { AppToggleRow } from '@/components/ui/app-toggle-row';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { dateAndTime } from '@/utils/dates';

/**
 * Changing the transaction PIN, and the biometric unlock preference.
 *
 * Replacing a PIN requires the current one, which is what stops someone with a
 * borrowed unlocked phone from taking over payments.
 */
export function SecurityScreen({
  hasPin,
  lockedUntil,
  biometricsAvailable,
  biometricsEnabled,
  submitting,
  error,
  saved,
  onToggleBiometrics,
  onSubmit,
}: {
  hasPin: boolean;
  lockedUntil: string | null;
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  submitting: boolean;
  error?: AppError | null;
  saved: boolean;
  onToggleBiometrics: (enabled: boolean) => void;
  onSubmit: (input: { pin: string; currentPin?: string }) => void;
}) {
  const { colors } = useTheme();
  const [currentPin, setCurrentPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [touched, setTouched] = useState(false);

  const four = (value: string) => /^\d{4}$/.test(value);
  const matches = pin === confirmPin;
  const ready = four(pin) && matches && (!hasPin || four(currentPin));
  // Captured once rather than read during render: Date.now is impure and would
  // give a different answer on each re-render.
  const [renderedAt] = useState(() => Date.now());
  const locked = lockedUntil !== null && new Date(lockedUntil).getTime() > renderedAt;

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
        {biometricsAvailable ? (
          <AppSection title="UNLOCKING">
            <AppToggleRow
              title="Unlock with biometrics"
              description="Use your fingerprint or face to open the app. Payments still need your PIN."
              value={biometricsEnabled}
              onValueChange={onToggleBiometrics}
            />
          </AppSection>
        ) : null}

        <AppSection title={hasPin ? 'CHANGE YOUR TRANSACTION PIN' : 'SET A TRANSACTION PIN'}>
          <AppCard style={styles.form}>
            {locked ? (
              <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
                <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
                  Too many wrong attempts. Try again after {dateAndTime(lockedUntil)}.
                </AppText>
              </View>
            ) : null}

            {hasPin ? (
              <AppInput
                label="Current PIN"
                value={currentPin}
                onChangeText={setCurrentPin}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                error={touched && !four(currentPin) ? 'Enter your current 4-digit PIN.' : undefined}
              />
            ) : null}

            <AppInput
              label="New PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              error={touched && !four(pin) ? 'Choose a 4-digit PIN.' : undefined}
            />
            <AppInput
              label="Confirm new PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              error={touched && !matches ? 'Those PINs do not match.' : undefined}
            />

            {error ? (
              <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
                <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
                  {error.message}
                </AppText>
              </View>
            ) : null}
            {saved && !error ? (
              <View style={[styles.notice, { backgroundColor: colors.successSoft }]}>
                <AppText style={{ color: colors.success }} accessibilityLiveRegion="polite">
                  Your PIN has been updated.
                </AppText>
              </View>
            ) : null}

            <AppButton
              label={hasPin ? 'Change PIN' : 'Set PIN'}
              onPress={() => {
                if (!ready) {
                  setTouched(true);
                  return;
                }
                onSubmit({ pin, ...(hasPin ? { currentPin } : {}) });
              }}
              loading={submitting}
              disabled={submitting || locked}
            />
          </AppCard>
        </AppSection>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  form: { gap: spacing.md },
  notice: { borderRadius: radius.md, padding: spacing.md },
});
