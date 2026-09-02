import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';

export function EditProfileScreen({
  firstName: initialFirst,
  lastName: initialLast,
  email,
  submitting,
  error,
  saved,
  onSubmit,
}: {
  firstName: string;
  lastName: string;
  email: string;
  submitting: boolean;
  error?: AppError | null;
  saved: boolean;
  onSubmit: (input: { firstName: string; lastName: string }) => void;
}) {
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [touched, setTouched] = useState(false);

  const firstValid = firstName.trim().length >= 1 && firstName.trim().length <= 100;
  const lastValid = lastName.trim().length >= 1 && lastName.trim().length <= 100;
  const changed = firstName.trim() !== initialFirst || lastName.trim() !== initialLast;

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
        <AppInput
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          error={touched && !firstValid ? 'Enter your first name.' : undefined}
        />
        <AppInput
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          error={touched && !lastValid ? 'Enter your last name.' : undefined}
        />

        {/* Read-only: changing it would move the account, and verification is
            tied to the address that was confirmed. */}
        <AppInput label="Email" value={email} editable={false} onChangeText={() => {}} />
        <AppText style={{ color: colors.textMuted }}>
          Contact support if you need to change the email on your account.
        </AppText>

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}
        {saved && !error ? (
          <AppText style={{ color: colors.success }} accessibilityLiveRegion="polite">
            Your details have been saved.
          </AppText>
        ) : null}

        <AppButton
          label="Save changes"
          onPress={() => {
            if (!firstValid || !lastValid) {
              setTouched(true);
              return;
            }
            onSubmit({ firstName: firstName.trim(), lastName: lastName.trim() });
          }}
          loading={submitting}
          disabled={submitting || !changed}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
});
