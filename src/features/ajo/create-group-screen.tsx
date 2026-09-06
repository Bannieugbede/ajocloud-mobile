import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { CreateAjoGroupInput } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppChipGroup } from '@/components/ui/app-chip-group';
import { AppInput } from '@/components/ui/app-input';
import { AppStepProgress } from '@/components/ui/app-step-progress';
import { AppStepper } from '@/components/ui/app-stepper';
import { AppText } from '@/components/ui/app-text';
import { AppToggleRow } from '@/components/ui/app-toggle-row';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, majorToMinor } from '@/utils/money';

import {
  CREATE_GROUP_STEPS,
  DURATION_OPTIONS,
  GRACE_DAY_OPTIONS,
  MAX_MEMBERS,
  MIN_MEMBERS,
  STEP_LABELS,
  coverageWarning,
  durationLabel,
  durationUnit,
  hasErrors,
  initialCreateGroupValues,
  parseMembers,
  payoutPerPositionMinor,
  stepMembers,
  toCreateRequest,
  validateStep,
  type ContributionMode,
  type CreateGroupValues,
  type Frequency,
} from './create-group-form';

const FREQUENCIES: readonly { value: Frequency; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Fortnightly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

const MODES: readonly { value: ContributionMode; title: string; description: string }[] = [
  { value: 'FIXED', title: 'Fixed Amount', description: 'Everyone pays the same' },
  {
    value: 'FLEXIBLE_UNIT',
    title: 'Variable Amount',
    description: 'Members contribute different amounts',
  },
];

/**
 * Creating a rotation, one decision at a time.
 *
 * Four steps rather than one long form, because the backend takes fifteen
 * fields and most have sensible defaults. The last is a review: a rotation is a
 * commitment of real money over months, so the terms are restated before the
 * group exists rather than only afterwards.
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
  const unit = durationUnit(values.frequency);

  const set = <K extends keyof CreateGroupValues>(key: K, value: CreateGroupValues[K]) => {
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
    // a group on terms the admin was never shown.
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
        <View style={styles.progress}>
          <AppStepProgress total={CREATE_GROUP_STEPS.length} current={stepIndex + 1} />
          <AppText weight="semibold" style={[styles.stepLabel, { color: colors.textMuted }]}>
            STEP {stepIndex + 1}: {STEP_LABELS[step]}
          </AppText>
        </View>

        {step === 'basics' ? (
          <>
            <AppInput
              label="Group name"
              value={values.name}
              onChangeText={(value) => set('name', value)}
              placeholder="e.g. Eko Savings Circle"
              autoCapitalize="words"
              error={show('name')}
            />

            <FieldLabel>GROUP TYPE</FieldLabel>
            <View style={styles.modes}>
              {MODES.map((option) => (
                <ModeCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  selected={values.mode === option.value}
                  onPress={() => set('mode', option.value)}
                />
              ))}
            </View>

            <AppChipGroup
              label="FREQUENCY"
              options={FREQUENCIES.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={values.frequency}
              onChange={(value) => set('frequency', value)}
              scroll
            />

            <AppChipGroup
              label={`DURATION — ${durationLabel(values.duration, values.frequency)}`}
              options={DURATION_OPTIONS.map((option) => ({
                value: option,
                label: `${String(option)}${unit.short}`,
              }))}
              value={values.duration}
              onChange={(value) => set('duration', value)}
              hint={`Maximum 12 ${unit.many}`}
            />
          </>
        ) : null}

        {step === 'members' ? (
          <>
            <FieldLabel>MAXIMUM MEMBERS</FieldLabel>
            <AppStepper
              label="Maximum members"
              value={values.maxSlots}
              unit="members"
              hint={`Up to ${MAX_MEMBERS.toLocaleString()} members`}
              onDecrement={() => set('maxSlots', stepMembers(values.maxSlots, -1))}
              onIncrement={() => set('maxSlots', stepMembers(values.maxSlots, 1))}
              canDecrement={(parseMembers(values.maxSlots) ?? MIN_MEMBERS) > MIN_MEMBERS}
              canIncrement={(parseMembers(values.maxSlots) ?? MIN_MEMBERS) < MAX_MEMBERS}
            />
            {show('maxSlots') ? <ErrorLine>{show('maxSlots')}</ErrorLine> : null}

            <AppToggleRow
              title="Multiple Slots"
              description="Members hold multiple positions"
              value={values.multipleSlots}
              onValueChange={(next) => {
                setValues((current) => ({
                  ...current,
                  multipleSlots: next,
                  // Turning it off must not leave a request for two positions
                  // behind, which would then fail validation invisibly.
                  requestedSlots: next ? current.requestedSlots : '1',
                }));
                setTouched(false);
              }}
            />

            {values.multipleSlots ? (
              <AppInput
                label="Positions you are taking"
                value={values.requestedSlots}
                onChangeText={(value) => set('requestedSlots', value)}
                keyboardType="number-pad"
                error={show('requestedSlots')}
              />
            ) : null}

            <CoverageNotice values={values} />
          </>
        ) : null}

        {step === 'amounts' ? (
          <>
            <AppInput
              label={
                values.mode === 'FLEXIBLE_UNIT'
                  ? 'Contribution per unit (₦)'
                  : 'Contribution per slot (₦)'
              }
              value={values.amountMajor}
              onChangeText={(value) => set('amountMajor', value)}
              placeholder="25000"
              keyboardType="decimal-pad"
              error={show('amountMajor')}
            />

            <AppChipGroup
              label="GRACE PERIOD"
              hint="How long a late contribution is tolerated before it counts as late."
              options={GRACE_DAY_OPTIONS.map((option) => ({
                value: option,
                label: `${String(option)}d`,
              }))}
              value={values.graceDays}
              onChange={(value) => set('graceDays', value)}
              tone="warning"
            />

            <PayoutNotice values={values} />
          </>
        ) : null}

        {step === 'review' ? <Review values={values} /> : null}

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
              style={styles.action}
            />
          ) : null}
          <AppButton
            label={isLast ? 'Launch Group' : 'Continue'}
            onPress={advance}
            loading={submitting}
            disabled={submitting}
            style={styles.action}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <AppText weight="semibold" style={[styles.fieldLabel, { color: colors.textMuted }]}>
      {children}
    </AppText>
  );
}

function ErrorLine({ children }: { children?: string }) {
  const { colors } = useTheme();
  if (!children) return null;
  return (
    <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
      {children}
    </AppText>
  );
}

function ModeCard({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeCard,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText weight="bold" style={{ color: selected ? colors.primary : colors.text }}>
        {title}
      </AppText>
      <AppText style={[styles.modeDescription, { color: colors.textMuted }]}>{description}</AppText>
    </Pressable>
  );
}

/**
 * Warns when the rotation is too short to pay everyone.
 *
 * A group whose duration cannot cover its positions strands the members at the
 * back of the rotation: they contribute and their turn never arrives. The
 * numbers are both the admin's to choose, so this names the conflict rather
 * than quietly changing one of them.
 */
function CoverageNotice({ values }: { values: CreateGroupValues }) {
  const { colors } = useTheme();
  const warning = coverageWarning(values);
  if (!warning) return null;
  return (
    <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
      <AppText weight="semibold" style={{ color: colors.warning }}>
        This rotation is shorter than its member count
      </AppText>
      <AppText style={{ color: colors.textMuted }}>{warning}</AppText>
    </View>
  );
}

/** What one position pays in and receives, stated before the amount is fixed. */
function PayoutNotice({ values }: { values: CreateGroupValues }) {
  const { colors } = useTheme();
  const amountMinor = majorToMinor(values.amountMajor);
  const slots = parseMembers(values.maxSlots);
  if (amountMinor === null || slots === null) return null;

  return (
    <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
      <AppText style={{ color: colors.textMuted }}>
        Each position pays {formatMinorAmount(amountMinor)} every{' '}
        {durationUnit(values.frequency).one} and receives{' '}
        {formatMinorAmount(payoutPerPositionMinor(amountMinor, slots))} when its turn comes.
      </AppText>
    </View>
  );
}

/** The terms, restated before the group exists. */
function Review({ values }: { values: CreateGroupValues }) {
  const { colors } = useTheme();
  const amountMinor = majorToMinor(values.amountMajor);
  const frequency = FREQUENCIES.find((option) => option.value === values.frequency);
  const warning = coverageWarning(values);

  return (
    <View style={styles.review}>
      <View style={[styles.summary, { backgroundColor: colors.primary }]}>
        <AppText weight="semibold" style={styles.summaryEyebrow}>
          NEW GROUP
        </AppText>
        <AppText weight="bold" style={styles.summaryName} numberOfLines={2}>
          {values.name.trim()}
        </AppText>
        <View style={styles.tags}>
          <Tag>{values.mode === 'FIXED' ? 'Fixed' : 'Variable'}</Tag>
          <Tag>{frequency?.label ?? ''}</Tag>
          <Tag>{durationLabel(values.duration, values.frequency)}</Tag>
        </View>
      </View>

      <ReviewRow label="Max members" value={values.maxSlots} />
      <ReviewRow
        label={values.mode === 'FLEXIBLE_UNIT' ? 'Contribution per unit' : 'Contribution'}
        value={amountMinor === null ? '—' : formatMinorAmount(amountMinor)}
      />
      <ReviewRow
        label="Multiple slots"
        value={values.multipleSlots ? 'Allowed' : 'One position each'}
      />
      <ReviewRow label="Grace period" value={`${String(values.graceDays)} days`} />
      <ReviewRow label="Starts" value="Today" />

      {warning ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText weight="semibold" style={{ color: colors.warning }}>
            Check the length before launching
          </AppText>
          <AppText style={{ color: colors.textMuted }}>{warning}</AppText>
        </View>
      ) : null}

      <AppCard style={styles.feeNote}>
        <AppText weight="semibold">Fees</AppText>
        <AppText style={{ color: colors.textMuted }}>
          {/* Stated rather than left blank: an admin who saw a fee step in a
              design will otherwise wonder what this group charges. */}
          Ajo Cloud does not charge this group a fee, and an admin cannot set one. See Platform Fees
          in your profile for what the app charges.
        </AppText>
      </AppCard>
    </View>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <View style={styles.tag}>
      <AppText weight="semibold" style={styles.tagText}>
        {children}
      </AppText>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.reviewRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight="bold">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

  progress: { gap: spacing.sm },
  stepLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },
  fieldLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },

  modes: { flexDirection: 'row', gap: spacing.sm },
  modeCard: { borderRadius: radius.lg, flex: 1, gap: 2, padding: spacing.md },
  modeDescription: { fontSize: fontSizes.caption },

  notice: { borderRadius: radius.md, gap: spacing.xs, padding: spacing.md },

  review: { gap: spacing.sm },
  summary: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  summaryEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSizes.caption,
    letterSpacing: 1,
  },
  summaryName: { color: '#FFFFFF', fontSize: fontSizes.heading },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { color: '#FFFFFF', fontSize: fontSizes.caption },

  reviewRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  feeNote: { gap: spacing.xs, marginTop: spacing.xs },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
