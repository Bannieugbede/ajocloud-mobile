import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { verifyIdentity, type IdentityKind } from '@/api/endpoints/kyc';
import { AppButton } from '@/components/ui/app-button';
import { AppCheckbox } from '@/components/ui/app-checkbox';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { StepScreen } from './step-screen';

const TABS: readonly { kind: IdentityKind; label: string; hint: string }[] = [
  { kind: 'BVN', label: 'BVN', hint: 'Dial *565*0# on your registered line to see yours.' },
  { kind: 'NIN', label: 'NIN', hint: 'Dial *346# or check your NIN slip.' },
];

/**
 * Step h. The entered number is held in component state for the length of one
 * submission and is cleared as soon as the request resolves. It is never put
 * into the persisted registration store, into SecureStore, into a route
 * param, or into a log. See ajocloud-backend/docs/adr/ADR-004.
 */
export function IdentityDocumentStep({
  onVerified,
}: {
  onVerified: (result: { maskedIdentifier: string; requiresReview: boolean }) => void;
}) {
  const { colors } = useTheme();
  const [kind, setKind] = useState<IdentityKind>('BVN');
  const [identityNumber, setIdentityNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: verifyIdentity,
    onSuccess: (result) => {
      // Drop the number the moment it is no longer needed.
      setIdentityNumber('');
      onVerified(result);
    },
    onError: () => setIdentityNumber(''),
  });

  const activeTab = TABS.find((tab) => tab.kind === kind) ?? TABS[0];

  const submit = () => {
    const trimmed = identityNumber.replace(/\s/g, '');
    if (trimmed.length !== 11) {
      setValidationError(`Your ${kind} is 11 digits`);
      return;
    }
    if (!consent) {
      setValidationError('Tick the box to let us verify your details');
      return;
    }
    setValidationError(undefined);
    mutation.mutate({ kind, identityNumber: trimmed, consent: true });
  };

  return (
    <StepScreen
      step="identity-document"
      title="Verify your identity"
      description="Enter either your BVN or your NIN. We check it with the identity authority and keep only the last 4 digits."
      error={validationError ?? (mutation.error as AppError | null)?.message}
    >
      <View style={styles.form}>
        <View
          accessibilityRole="tablist"
          style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {TABS.map((tab) => {
            const selected = tab.kind === kind;
            return (
              <Pressable
                key={tab.kind}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  setKind(tab.kind);
                  // Never carry a number typed for one scheme into the other.
                  setIdentityNumber('');
                  setValidationError(undefined);
                }}
                style={[styles.tab, selected && { backgroundColor: colors.primary }]}
              >
                <AppText
                  weight="semibold"
                  style={{ color: selected ? colors.textInverse : colors.textMuted }}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppInput
          label={`${kind} number`}
          value={identityNumber}
          onChangeText={(text) => setIdentityNumber(text.replace(/\D/g, '').slice(0, 11))}
          keyboardType="number-pad"
          maxLength={11}
          editable={!mutation.isPending}
          // Never offered to the keyboard's autofill or clipboard suggestions.
          autoComplete="off"
          autoCorrect={false}
          textContentType="none"
          testID="identity-number-input"
        />
        <AppText style={[styles.hint, { color: colors.textMuted }]}>{activeTab.hint}</AppText>

        <AppCheckbox
          label={`I allow Ajo Cloud to verify my ${kind} with the identity authority`}
          checked={consent}
          onChange={setConsent}
          disabled={mutation.isPending}
        />

        <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
          <AppText style={[styles.noticeText, { color: colors.textMuted }]}>
            We never store your full {kind}. It is sent once over an encrypted connection, checked,
            and discarded — only {'•'.repeat(7)}1234 is kept.
          </AppText>
        </View>

        <AppButton
          label="Verify"
          onPress={submit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
        />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  tabs: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
  },
  hint: { fontSize: fontSizes.caption },
  notice: { borderRadius: radius.md, padding: spacing.md },
  noticeText: { fontSize: fontSizes.caption, lineHeight: 18 },
});
