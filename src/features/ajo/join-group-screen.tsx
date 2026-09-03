import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';

/**
 * An invitation code is a 32-byte value in base64url, so it is long and mixed
 * case. Pasting is the realistic path, and autocorrect would corrupt it.
 */
export const MIN_INVITATION_CODE_LENGTH = 32;

export function JoinGroupScreen({
  submitting,
  error,
  initialGroupId = '',
  initialInvitationCode = '',
  onSubmit,
}: {
  submitting: boolean;
  error?: AppError | null;
  /**
   * Prefilled when the screen was reached from an invitation link, which
   * already carries both values. Typing them by hand is the fallback for
   * someone who was read a code rather than sent one.
   */
  initialGroupId?: string;
  initialInvitationCode?: string;
  onSubmit: (input: { groupId: string; invitationCode: string; requestedSlots: number }) => void;
}) {
  const { colors } = useTheme();
  const [groupId, setGroupId] = useState(initialGroupId);
  const [code, setCode] = useState(initialInvitationCode);
  const [slots, setSlots] = useState('1');
  const [touched, setTouched] = useState(false);

  const codeValid = code.trim().length >= MIN_INVITATION_CODE_LENGTH;
  const groupValid = groupId.trim().length > 0;
  const slotsValue = /^\d+$/.test(slots.trim()) ? Number(slots.trim()) : 0;
  const slotsValid = slotsValue >= 1;
  const canSubmit = codeValid && groupValid && slotsValid && !submitting;

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
          {initialInvitationCode
            ? 'Choose how many positions you want in this group.'
            : 'Ask the group administrator for the invitation they were given when the group was created.'}
        </AppText>

        <AppInput
          label="Group ID"
          value={groupId}
          onChangeText={setGroupId}
          placeholder="Shared with the invitation"
          autoCapitalize="none"
          autoCorrect={false}
          error={touched && !groupValid ? 'Enter the group ID from the invitation.' : undefined}
        />

        <AppInput
          label="Invitation code"
          value={code}
          onChangeText={setCode}
          placeholder="Paste the code"
          autoCapitalize="none"
          autoCorrect={false}
          // The code is case-sensitive base64url; autocorrect would break it.
          spellCheck={false}
          error={
            touched && !codeValid ? 'That code looks too short. Paste the whole one.' : undefined
          }
        />

        <AppInput
          label="Positions you want"
          value={slots}
          onChangeText={setSlots}
          keyboardType="number-pad"
          error={touched && !slotsValid ? 'Take at least one position.' : undefined}
        />

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Join group"
          onPress={() => {
            if (!canSubmit) {
              setTouched(true);
              return;
            }
            onSubmit({
              groupId: groupId.trim(),
              invitationCode: code.trim(),
              requestedSlots: slotsValue,
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
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
});
