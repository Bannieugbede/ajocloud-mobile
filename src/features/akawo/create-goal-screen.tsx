import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import type { AkawoGoalType, CreateAkawoGoalInput } from '@/api/endpoints/akawo';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppSelect } from '@/components/ui/app-select';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import {
  hasGoalErrors,
  initialGoalValues,
  needsDate,
  needsTarget,
  toGoalRequest,
  validateGoal,
  type GoalValues,
} from './goal-form';

const TYPES: readonly { value: AkawoGoalType; label: string }[] = [
  { value: 'TARGET', label: 'Towards an amount' },
  { value: 'FLEXIBLE', label: 'Save as I go' },
  { value: 'LOCKED', label: 'Locked until a date' },
];

const TYPE_HELP: Record<AkawoGoalType, string> = {
  TARGET: 'You choose an amount to reach. You can take money out at any time.',
  FLEXIBLE: 'An open pot with no target. Add and withdraw whenever you like.',
  LOCKED: 'You cannot withdraw until the date you choose. Pick it carefully.',
};

export function CreateGoalScreen({
  submitting,
  error,
  onSubmit,
}: {
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (input: CreateAkawoGoalInput) => void;
}) {
  const { colors } = useTheme();
  const [values, setValues] = useState<GoalValues>(initialGoalValues);
  const [touched, setTouched] = useState(false);
  // Captured once so validation cannot see the clock move between two checks
  // in the same render.
  const [now] = useState(() => new Date());

  const errors = validateGoal(values, now);
  const set = (key: keyof GoalValues) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const show = (key: keyof GoalValues) => (touched ? errors[key] : undefined);

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
          label="What are you saving for?"
          value={values.name}
          onChangeText={set('name')}
          placeholder="e.g. School fees"
          autoCapitalize="sentences"
          error={show('name')}
        />

        <AppSelect
          label="Kind of goal"
          value={values.type}
          options={TYPES}
          onChange={(value) => set('type')(value)}
        />
        <AppText style={{ color: colors.textMuted }}>{TYPE_HELP[values.type]}</AppText>

        {needsTarget(values.type) ? (
          <AppInput
            label="Amount you are saving towards"
            value={values.targetMajor}
            onChangeText={set('targetMajor')}
            placeholder="50000"
            keyboardType="decimal-pad"
            error={show('targetMajor')}
          />
        ) : null}

        <AppInput
          label={needsDate(values.type) ? 'Unlocks on' : 'Target date (optional)'}
          value={values.targetDate}
          onChangeText={set('targetDate')}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          error={show('targetDate')}
        />

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Create goal"
          onPress={() => {
            const request = toGoalRequest(values, now);
            if (!request || hasGoalErrors(errors)) {
              setTouched(true);
              return;
            }
            onSubmit(request);
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
