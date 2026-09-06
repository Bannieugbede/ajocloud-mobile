import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppChipGroup } from '@/components/ui/app-chip-group';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { majorToMinor } from '@/utils/money';

import {
  DUE_OPTIONS,
  dueDateFrom,
  dueDatePreview,
  poolProblem,
  poolProblemMessage,
} from './create-pool-form';

export type CreatePoolValues = {
  name: string;
  purpose: string;
  amountMajor: string;
  referenceLabel: string;
  dueDays: number;
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
    dueAt?: string;
  }) => void;
}) {
  const { colors } = useTheme();
  const [values, setValues] = useState<CreatePoolValues>({
    name: '',
    purpose: '',
    amountMajor: '',
    referenceLabel: 'Matric number',
    dueDays: 30,
  });
  const [touched, setTouched] = useState(false);

  const amountMinor = majorToMinor(values.amountMajor);
  const problem = poolProblem({ name: values.name, amountMinor });
  const message = touched ? poolProblemMessage(problem) : null;

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
        <AppInput
          label="POOL TITLE"
          value={values.name}
          onChangeText={set('name')}
          placeholder="e.g. 2024/2025 Departmental Dues"
          autoCapitalize="sentences"
          error={problem === 'name' ? (message ?? undefined) : undefined}
        />

        <AppInput
          label="DESCRIPTION"
          value={values.purpose}
          onChangeText={set('purpose')}
          placeholder="What is this collection for? What will the money be used for?"
          autoCapitalize="sentences"
          multiline
        />

        <AppInput
          label="AMOUNT PER MEMBER (₦)"
          value={values.amountMajor}
          onChangeText={set('amountMajor')}
          placeholder="5000"
          keyboardType="decimal-pad"
          error={problem === 'amount' ? (message ?? undefined) : undefined}
        />

        <AppChipGroup
          label="PAYMENT DUE DATE"
          options={DUE_OPTIONS}
          value={values.dueDays}
          onChange={(dueDays) => setValues((current) => ({ ...current, dueDays }))}
          hint={dueDatePreview(values.dueDays)}
          scroll
        />

        <AppInput
          label="MEMBERS IDENTIFY THEMSELVES WITH"
          value={values.referenceLabel}
          onChangeText={set('referenceLabel')}
          placeholder="Matric number"
          autoCapitalize="words"
        />

        <View style={[styles.info, { backgroundColor: colors.primarySoft }]}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <AppText style={[styles.infoText, { color: colors.primary }]}>
            Members join with a code using their full name and{' '}
            {values.referenceLabel.trim()
              ? values.referenceLabel.trim().toLowerCase()
              : 'reference'}
            . All payments are recorded and can be exported as PDF.
          </AppText>
        </View>

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
            <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
              {error.message}
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      {/* Pinned rather than trailing the fields: the form is long enough on a
          small phone that the action would otherwise sit below the fold. */}
      <View
        style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        <AppButton
          label="Create Pool"
          loading={submitting}
          onPress={() => {
            setTouched(true);
            if (problem !== null || amountMinor === null) return;
            const dueAt = dueDateFrom(values.dueDays);
            onSubmit({
              name: values.name.trim(),
              amountMinor,
              ...(values.purpose.trim() ? { purpose: values.purpose.trim() } : {}),
              ...(values.referenceLabel.trim()
                ? { referenceLabel: values.referenceLabel.trim() }
                : {}),
              ...(dueAt ? { dueAt } : {}),
            });
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  info: { borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  infoText: { flex: 1, fontSize: fontSizes.caption },
  notice: { borderRadius: radius.md, padding: spacing.md },
  footer: { borderTopWidth: 1, padding: spacing.md },
});
