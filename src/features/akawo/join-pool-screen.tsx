import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { PoolPreview } from '@/api/endpoints/akawo-pools';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';

/**
 * Joining is two steps on one screen: look the code up, then confirm with the
 * name and reference the organiser will reconcile against. The lookup exists so
 * nobody commits to paying before seeing what they are paying for.
 */
export function JoinPoolScreen({
  preview,
  looking,
  joining,
  error,
  onLookup,
  onJoin,
  onClearPreview,
}: {
  preview?: PoolPreview | null;
  looking: boolean;
  joining: boolean;
  error?: AppError | null;
  onLookup: (joinCode: string) => void;
  onJoin: (values: { joinCode: string; fullName: string; reference: string }) => void;
  onClearPreview: () => void;
}) {
  const { colors } = useTheme();
  const [joinCode, setJoinCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [reference, setReference] = useState('');
  const [touched, setTouched] = useState(false);

  const codeReady = joinCode.trim().length >= 6;
  const detailsReady = fullName.trim().length >= 2 && reference.trim().length >= 1;

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
          label="Join code"
          value={joinCode}
          onChangeText={(value) => {
            setJoinCode(value.toUpperCase());
            if (preview) onClearPreview();
          }}
          placeholder="ABCD2345"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!preview}
        />

        {!preview ? (
          <AppButton
            label="Find pool"
            loading={looking}
            disabled={!codeReady}
            onPress={() => onLookup(joinCode.trim())}
          />
        ) : null}

        {error && !preview ? (
          <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
            <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
              {error.message}
            </AppText>
          </View>
        ) : null}

        {preview ? (
          <>
            <View style={[styles.summary, { backgroundColor: colors.primarySoft }]}>
              <AppText weight="semibold">{preview.name}</AppText>
              {preview.purpose ? (
                <AppText style={{ color: colors.textMuted }}>{preview.purpose}</AppText>
              ) : null}
              <AppText style={{ color: colors.textMuted }}>
                Organised by {preview.organiserName}
              </AppText>
              <AppAmount
                amountMinor={preview.amountMinor}
                currency={preview.currency}
                size="title"
              />
            </View>

            <AppInput
              label="Your full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ada Okafor"
              autoCapitalize="words"
              error={touched && fullName.trim().length < 2 ? 'Enter your full name.' : undefined}
            />

            <AppInput
              label={preview.referenceLabel}
              value={reference}
              onChangeText={setReference}
              placeholder={`Your ${preview.referenceLabel.toLowerCase()}`}
              autoCapitalize="characters"
              autoCorrect={false}
              error={
                touched && reference.trim().length < 1
                  ? `Enter your ${preview.referenceLabel.toLowerCase()}.`
                  : undefined
              }
            />

            {error ? (
              <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
                <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
                  {error.message}
                </AppText>
              </View>
            ) : null}

            <AppButton
              label="Join pool"
              loading={joining}
              onPress={() => {
                setTouched(true);
                if (!detailsReady) return;
                onJoin({
                  joinCode: joinCode.trim(),
                  fullName: fullName.trim(),
                  reference: reference.trim(),
                });
              }}
            />
            <AppButton label="Use a different code" variant="ghost" onPress={onClearPreview} />
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  summary: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },
  notice: { borderRadius: radius.md, padding: spacing.md },
});
