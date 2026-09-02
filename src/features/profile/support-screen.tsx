import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';

const MIN_MESSAGE = 10;

export function SupportScreen({
  submitting,
  error,
  sent,
  onSubmit,
  onStartAnother,
}: {
  submitting: boolean;
  error?: AppError | null;
  sent: boolean;
  onSubmit: (input: { subject: string; message: string }) => void;
  onStartAnother: () => void;
}) {
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);

  const subjectValid = subject.trim().length >= 3;
  const messageValid = message.trim().length >= MIN_MESSAGE;

  if (sent) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <AppText accessibilityRole="header" weight="semibold">
          Thanks — we have your message
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          Support will reply to the email address on your account.
        </AppText>
        <AppButton label="Send another" variant="outline" onPress={onStartAnother} />
      </ScrollView>
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
        <AppText style={{ color: colors.textMuted }}>
          {/* Name and email are taken from the account rather than asked for
              again, so nobody retypes what we already hold. */}
          Tell us what is wrong. We will reply to the email on your account.
        </AppText>

        <AppInput
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g. A payment did not arrive"
          autoCapitalize="sentences"
          error={touched && !subjectValid ? 'Give your message a short subject.' : undefined}
        />

        <AppInput
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="What happened?"
          autoCapitalize="sentences"
          multiline
          numberOfLines={6}
          maxLength={5000}
          style={styles.message}
          error={
            touched && !messageValid
              ? `Please write at least ${MIN_MESSAGE} characters so we can help.`
              : undefined
          }
        />

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Send message"
          onPress={() => {
            if (!subjectValid || !messageValid) {
              setTouched(true);
              return;
            }
            onSubmit({ subject: subject.trim(), message: message.trim() });
          }}
          loading={submitting}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
  message: { minHeight: 120, textAlignVertical: 'top' },
});
