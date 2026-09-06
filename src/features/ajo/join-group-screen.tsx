import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppStepper } from '@/components/ui/app-stepper';
import { AppText } from '@/components/ui/app-text';
import { AppToggleRow } from '@/components/ui/app-toggle-row';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';

/**
 * An invitation code is a 32-byte value in base64url, so it is long and mixed
 * case. Pasting is the realistic path, and autocorrect would corrupt it.
 */
export const MIN_INVITATION_CODE_LENGTH = 32;

export type ResolvedGroup = { groupId: string; groupName: string };

/**
 * Joining a rotation with a code.
 *
 * Two stages rather than one form. The code is verified first, so the member
 * sees which group they are about to join before committing to it — a code read
 * aloud or forwarded is easy to get wrong, and joining the wrong rotation is a
 * commitment of real money. Only once a group is named does the screen ask how
 * many positions to take.
 */
export function JoinGroupScreen({
  submitting,
  verifying,
  error,
  resolved,
  initialInvitationCode = '',
  onVerify,
  onSubmit,
}: {
  submitting: boolean;
  verifying: boolean;
  error?: AppError | null;
  /** The group the code admits, once verified. Null until then. */
  resolved?: ResolvedGroup | null;
  /** Prefilled when the screen was reached from an invitation link. */
  initialInvitationCode?: string;
  onVerify: (code: string) => void;
  onSubmit: (input: { groupId: string; invitationCode: string; requestedSlots: number }) => void;
}) {
  const { colors } = useTheme();
  const [code, setCode] = useState(initialInvitationCode);
  const [slots, setSlots] = useState('1');
  const [multiple, setMultiple] = useState(false);
  const [touched, setTouched] = useState(false);

  const trimmed = code.trim();
  const codeValid = trimmed.length >= MIN_INVITATION_CODE_LENGTH;
  const slotsValue = /^\d+$/.test(slots.trim()) ? Number(slots.trim()) : 0;

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
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.medallion, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons name="person-add-outline" size={26} color={colors.primary} />
        </View>

        <AppText style={{ color: colors.textMuted }}>
          Enter the invitation code from your group admin to check the group and join.
        </AppText>

        <AppInput
          label="Invitation code"
          value={code}
          onChangeText={(value) => {
            setCode(value);
            setTouched(false);
          }}
          placeholder="Paste the code"
          autoCapitalize="none"
          autoCorrect={false}
          // The code is case-sensitive base64url; autocorrect would break it.
          spellCheck={false}
          editable={!resolved}
          error={
            touched && !codeValid ? 'That code looks too short. Paste the whole one.' : undefined
          }
        />

        {resolved ? (
          <>
            <View style={[styles.resolved, { backgroundColor: colors.successSoft }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <View style={styles.resolvedText}>
                <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
                  You are joining
                </AppText>
                <AppText weight="bold" numberOfLines={2}>
                  {resolved.groupName}
                </AppText>
              </View>
            </View>

            <AppToggleRow
              title="Take more than one position"
              description="Hold several positions in the rotation"
              value={multiple}
              onValueChange={(next) => {
                setMultiple(next);
                if (!next) setSlots('1');
              }}
            />

            {multiple ? (
              <AppStepper
                label="Positions you want"
                value={slots}
                unit="positions"
                hint="The admin may cap how many one member can hold."
                onDecrement={() => setSlots(String(Math.max(1, slotsValue - 1)))}
                onIncrement={() => setSlots(String(slotsValue + 1))}
                canDecrement={slotsValue > 1}
              />
            ) : null}
          </>
        ) : null}

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        {resolved ? (
          <AppButton
            label="Join group"
            onPress={() =>
              onSubmit({
                groupId: resolved.groupId,
                invitationCode: trimmed,
                requestedSlots: Math.max(1, slotsValue),
              })
            }
            loading={submitting}
            disabled={submitting}
          />
        ) : (
          <AppButton
            label="Verify code"
            onPress={() => {
              if (!codeValid) {
                setTouched(true);
                return;
              }
              onVerify(trimmed);
            }}
            loading={verifying}
            // Disabled until the code could plausibly be one, so the button
            // cannot spend a request on something that is obviously too short.
            disabled={verifying || !codeValid}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  medallion: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  resolved: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  resolvedText: { flex: 1, gap: 2 },
});
