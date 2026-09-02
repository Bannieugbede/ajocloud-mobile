import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppSelect } from '@/components/ui/app-select';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, majorToMinor } from '@/utils/money';
import {
  CREATE_GROUP_STEPS,
  deriveEndDate,
  hasErrors,
  initialCreateGroupValues,
  parseDate,
  toCreateRequest,
  validateStep,
  type CreateGroupStep,
  type CreateGroupValues,
  type Frequency,
} from './create-group-form';
import type { CreateAjoGroupInput } from '@/api/endpoints/ajo-groups';

const FREQUENCIES: readonly { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Every day' },
  { value: 'WEEKLY', label: 'Every week' },
  { value: 'BIWEEKLY', label: 'Every two weeks' },
  { value: 'MONTHLY', label: 'Every month' },
];

const STEP_TITLES: Record<CreateGroupStep, string> = {
  basics: 'What is this Ajo?',
  slots: 'How many positions?',
  schedule: 'When does it start?',
  advanced: 'Anything else?',
};

/**
 * Creating a rotation, one decision at a time.
 *
 * Split into steps rather than one long form because the backend takes fifteen
 * fields, most of which have sensible defaults. The last step is optional, so
 * the common case is three short screens.
 */
export function CreateGroupScreen({
  submitting,
  error,
  onSubmit,
}: {
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (input: CreateAjoGroupInput) => void;
}) {
  const { colors } = useTheme();
  const [values, setValues] = useState<CreateGroupValues>(initialCreateGroupValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [touched, setTouched] = useState(false);

  const step = CREATE_GROUP_STEPS[stepIndex] ?? 'basics';
  const errors = validateStep(step, values);
  const blocked = hasErrors(errors);
  const isLast = stepIndex === CREATE_GROUP_STEPS.length - 1;

  const set = (key: keyof CreateGroupValues) => (value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setTouched(false);
  };
  const show = (key: keyof CreateGroupValues) => (touched ? errors[key] : undefined);

  const advance = () => {
    if (blocked) {
      setTouched(true);
      return;
    }
    if (!isLast) {
      setStepIndex((index) => index + 1);
      setTouched(false);
      return;
    }
    const request = toCreateRequest(values);
    // Null means an earlier step regressed; sending a partial body would create
    // a group with the wrong terms.
    if (!request) {
      setTouched(true);
      return;
    }
    onSubmit(request);
  };

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
          Step {stepIndex + 1} of {CREATE_GROUP_STEPS.length}
        </AppText>
        <AppText weight="semibold" style={styles.stepTitle}>
          {STEP_TITLES[step]}
        </AppText>

        {step === 'basics' ? (
          <>
            <AppInput
              label="Group name"
              value={values.name}
              onChangeText={set('name')}
              placeholder="e.g. Family Rotation"
              autoCapitalize="sentences"
              error={show('name')}
            />
            <AppInput
              label="Contribution per position"
              value={values.amountMajor}
              onChangeText={set('amountMajor')}
              placeholder="10000"
              keyboardType="decimal-pad"
              error={show('amountMajor')}
            />
            <AppSelect
              label="How often"
              value={values.frequency}
              options={FREQUENCIES}
              onChange={(value) => set('frequency')(value)}
            />
          </>
        ) : null}

        {step === 'slots' ? (
          <>
            <AppText style={{ color: colors.textMuted }}>
              Each position is paid out once, in turn. Six positions means six rounds.
            </AppText>
            <AppInput
              label="Positions in the rotation"
              value={values.maxSlots}
              onChangeText={set('maxSlots')}
              placeholder="6"
              keyboardType="number-pad"
              error={show('maxSlots')}
            />
            <AppInput
              label="Positions you are taking"
              value={values.requestedSlots}
              onChangeText={set('requestedSlots')}
              keyboardType="number-pad"
              error={show('requestedSlots')}
            />
          </>
        ) : null}

        {step === 'schedule' ? (
          <>
            <AppInput
              label="First contribution date"
              value={values.startDate}
              onChangeText={set('startDate')}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              error={show('startDate')}
            />
            <AppText style={{ color: colors.textMuted }}>
              The rotation ends once every position has been paid out. We work the end date out from
              this.
            </AppText>
          </>
        ) : null}

        {step === 'advanced' ? (
          <>
            <AppText style={{ color: colors.textMuted }}>
              You can skip this. Leaving it blank lets a member hold as many positions as the group
              has.
            </AppText>
            <AppInput
              label="Most positions one member may hold"
              value={values.maxSlotsPerMember}
              onChangeText={set('maxSlotsPerMember')}
              placeholder="No limit"
              keyboardType="number-pad"
              error={show('maxSlotsPerMember')}
            />
            <Summary values={values} />
          </>
        ) : null}

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          {stepIndex > 0 ? (
            <AppButton
              label="Back"
              variant="outline"
              onPress={() => {
                setStepIndex((index) => index - 1);
                setTouched(false);
              }}
            />
          ) : null}
          <AppButton
            label={isLast ? 'Create group' : 'Continue'}
            onPress={advance}
            loading={submitting}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** What the user is about to create, in their own terms, before committing. */
function Summary({ values }: { values: CreateGroupValues }) {
  const { colors } = useTheme();
  const amountMinor = majorToMinor(values.amountMajor);
  const start = parseDate(values.startDate);
  const slots = Number(values.maxSlots);
  if (!amountMinor || !start || !Number.isSafeInteger(slots) || slots < 2) return null;

  const end = deriveEndDate(start, values.frequency, slots);
  const frequency = FREQUENCIES.find((option) => option.value === values.frequency)?.label ?? '';
  // The payout is what every position receives once: one contribution from each.
  const payout = (BigInt(amountMinor) * BigInt(slots)).toString();

  return (
    <AppCard>
      <AppText weight="semibold">Before you create this</AppText>
      <AppText style={{ color: colors.textMuted }}>
        {slots} positions, {frequency.toLowerCase()}.
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        Each position pays {formatMinorAmount(amountMinor)} and receives {formatMinorAmount(payout)}{' '}
        when its turn comes.
      </AppText>
      <AppText style={{ color: colors.textMuted }}>
        Runs until {end.toISOString().slice(0, 10)}.
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
  stepTitle: { fontSize: fontSizes.title },
});
