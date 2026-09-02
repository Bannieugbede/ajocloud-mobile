import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { majorToMinor } from '@/utils/money';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';

export type CreatePoolValues = {
  name: string;
  purpose: string;
  amountMajor: string;
  referenceLabel: string;
};

export function CreatePoolScreen({
  submitting,
  error,
  onSubmit,
}: {
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (values: {
    name: string;
    purpose?: string;
    amountMinor: string;
    referenceLabel?: string;
  }) => void;
}) {
  const { colors } = useTheme();
  const [values, setValues] = useState<CreatePoolValues>({
    name: '',
    purpose: '',
    amountMajor: '',
    referenceLabel: 'Matric number',
  });
  const [touched, setTouched] = useState(false);

  const amountMinor = majorToMinor(values.amountMajor);
  const nameValid = values.name.trim().length >= 3;
  const canSubmit = nameValid && amountMinor !== null && !submitting;

  const set = (key: keyof CreatePoolValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

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
          Everyone in a pool pays the same amount. You will get a code to share once it is created.
        </AppText>

        <AppInput
          label="Pool name"
          value={values.name}
          onChangeText={set('name')}
          placeholder="e.g. Class of 2026 dues"
          autoCapitalize="sentences"
          error={
            touched && !nameValid ? 'Give the pool a name of at least 3 characters.' : undefined
          }
        />

        <AppInput
          label="What is it for?"
          value={values.purpose}
          onChangeText={set('purpose')}
          placeholder="Optional"
          autoCapitalize="sentences"
          multiline
        />

        <AppInput
          label="Amount per person"
          value={values.amountMajor}
          onChangeText={set('amountMajor')}
          placeholder="5000"
          keyboardType="decimal-pad"
          error={touched && amountMinor === null ? 'Enter an amount greater than zero.' : undefined}
        />

        <AppInput
          label="What should members identify themselves with?"
          value={values.referenceLabel}
          onChangeText={set('referenceLabel')}
          placeholder="Matric number"
          autoCapitalize="words"
        />
        <AppText style={[styles.hint, { color: colors.textSubtle }]}>
          Members enter this when they join, so you can match payments to people.
        </AppText>

        {error ? (
          <View style={[styles.error, { backgroundColor: colors.errorSoft }]}>
            <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
              {error.message}
            </AppText>
          </View>
        ) : null}

        <AppButton
          label="Create pool"
          loading={submitting}
          onPress={() => {
            setTouched(true);
            if (!canSubmit || amountMinor === null) return;
            onSubmit({
              name: values.name.trim(),
              amountMinor,
              ...(values.purpose.trim() ? { purpose: values.purpose.trim() } : {}),
              ...(values.referenceLabel.trim()
                ? { referenceLabel: values.referenceLabel.trim() }
                : {}),
            });
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: { fontSize: fontSizes.caption },
  error: { borderRadius: radius.md, padding: spacing.md },
});
