import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type { Bank } from '@/api/endpoints/kyc';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppCheckbox } from '@/components/ui/app-checkbox';
import { AppChipGroup } from '@/components/ui/app-chip-group';
import { AppInput } from '@/components/ui/app-input';
import { AppMedallion } from '@/components/ui/app-medallion';
import { AppSection } from '@/components/ui/app-section';
import { AppSelect } from '@/components/ui/app-select';
import { AppStepProgress } from '@/components/ui/app-step-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { NIGERIAN_STATES } from '@/utils/nigerian-states';

import {
  COORDINATOR_STEPS,
  FULFILMENT_OPTIONS,
  STEP_LABELS,
  hasErrors,
  initialCoordinatorApplicationValues,
  maskAccountNumber,
  maskIdentityNumber,
  validateStep,
  type CoordinatorApplicationValues,
  type CoordinatorStep,
} from './coordinator-application-form';

/**
 * Applying to run food programmes.
 *
 * Five steps rather than one form: this asks for contact details, a trading
 * address, how food is handed over, and a settlement account, and a validation
 * failure on the last of those should not send someone back through the first
 * four.
 *
 * The account number is masked before it leaves the screen — the backend field
 * is `settlementAccountMasked` and there is no unmasked counterpart — so the
 * digits typed here are never sent, stored, or retried.
 */
export function CoordinatorApplicationScreen({
  banks,
  banksLoading,
  submitting,
  error,
  onSubmit,
}: {
  banks?: Bank[];
  banksLoading: boolean;
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (values: CoordinatorApplicationValues) => void;
}) {
  const { colors } = useTheme();
  const [values, setValues] = useState(initialCoordinatorApplicationValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [touched, setTouched] = useState(false);

  const step: CoordinatorStep = COORDINATOR_STEPS[stepIndex] ?? 'contact';
  const errors = touched ? validateStep(step, values) : {};
  const blocked = hasErrors(validateStep(step, values));
  const isLast = stepIndex === COORDINATOR_STEPS.length - 1;

  const set =
    <K extends keyof CoordinatorApplicationValues>(key: K) =>
    (value: CoordinatorApplicationValues[K]) => {
      setValues((current) => ({ ...current, [key]: value }));
      setTouched(false);
    };

  const advance = () => {
    if (blocked) {
      setTouched(true);
      return;
    }
    if (isLast) {
      onSubmit(values);
      return;
    }
    setStepIndex((index) => index + 1);
    setTouched(false);
  };

  const bankOptions = (banks ?? []).map((bank) => ({ value: bank.code, label: bank.name }));
  const bankName = bankOptions.find((option) => option.value === values.bankCode)?.label;

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
          <AppStepProgress total={COORDINATOR_STEPS.length} current={stepIndex + 1} />
          <AppText weight="semibold" style={[styles.stepLabel, { color: colors.textMuted }]}>
            STEP {stepIndex + 1} OF {COORDINATOR_STEPS.length}: {STEP_LABELS[step]}
          </AppText>
        </View>

        {step === 'contact' ? (
          <AppSection title="HOW MEMBERS REACH YOU">
            <AppCard style={styles.form}>
              <AppInput
                label="Full name"
                value={values.contactName}
                onChangeText={set('contactName')}
                placeholder="Ada Okafor"
                autoCapitalize="words"
                error={errors.contactName}
              />
              <AppInput
                label="Phone number"
                value={values.contactPhone}
                onChangeText={set('contactPhone')}
                placeholder="08031234567"
                keyboardType="phone-pad"
                error={errors.contactPhone}
              />
              <AppInput
                label="WhatsApp number"
                value={values.whatsappPhone}
                onChangeText={set('whatsappPhone')}
                placeholder="08031234567"
                keyboardType="phone-pad"
                error={errors.whatsappPhone}
              />
              <AppText style={[styles.hint, { color: colors.textSubtle }]}>
                Members buying a package will see this name and use these numbers to reach you about
                their food. The WhatsApp number is the one the app opens a chat with, so it can
                differ from the line you take calls on.
              </AppText>
            </AppCard>
          </AppSection>
        ) : null}

        {step === 'business' ? (
          <AppSection title="YOUR BUSINESS">
            <AppCard style={styles.form}>
              <AppText style={{ color: colors.textMuted }}>
                If you trade as a registered business, give its CAC number. If you coordinate as an
                individual, give your NIN instead — we need one or the other to verify who is
                handling members&rsquo; food money.
              </AppText>
              <AppInput
                label="Business name"
                value={values.businessName}
                onChangeText={set('businessName')}
                placeholder="Okafor Foods"
                autoCapitalize="words"
                error={errors.businessName}
              />
              <AppInput
                label="CAC registration number"
                value={values.businessRegistrationNumber}
                onChangeText={set('businessRegistrationNumber')}
                placeholder="RC123456"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <AppInput
                label="NIN"
                value={values.nin}
                onChangeText={set('nin')}
                placeholder="12345678901"
                keyboardType="number-pad"
                autoCorrect={false}
                error={errors.nin}
              />
            </AppCard>
          </AppSection>
        ) : null}

        {step === 'location' ? (
          <AppSection title="WHERE YOU TRADE">
            <AppCard style={styles.form}>
              <AppInput
                label="Street address"
                value={values.addressLine}
                onChangeText={set('addressLine')}
                placeholder="14 Awolowo Road"
                autoCapitalize="words"
                error={errors.addressLine}
              />
              <AppInput
                label="Town or city"
                value={values.city}
                onChangeText={set('city')}
                placeholder="Ikeja"
                autoCapitalize="words"
                error={errors.city}
              />
              <AppSelect
                label="State"
                value={values.state}
                options={NIGERIAN_STATES}
                onChange={set('state')}
                placeholder="Choose a state"
                searchable
                error={errors.state}
              />
              <AppChipGroup
                label="HOW MEMBERS GET THEIR FOOD"
                options={FULFILMENT_OPTIONS}
                value={values.fulfilment}
                onChange={set('fulfilment')}
              />
              {values.fulfilment === 'PICKUP' ? null : (
                <AppInput
                  label="Areas you deliver to"
                  value={values.fulfilmentNotes}
                  onChangeText={set('fulfilmentNotes')}
                  placeholder="Ikeja, Yaba and Surulere"
                  autoCapitalize="words"
                  multiline
                  error={errors.fulfilmentNotes}
                />
              )}
            </AppCard>
          </AppSection>
        ) : null}

        {step === 'settlement' ? (
          <AppSection title="WHERE YOUR EARNINGS GO">
            <AppCard style={styles.form}>
              <AppSelect
                label="Bank"
                value={values.bankCode}
                options={bankOptions}
                onChange={set('bankCode')}
                placeholder={banksLoading ? 'Loading banks…' : 'Choose your bank'}
                searchable
                error={errors.bankCode}
              />
              <AppInput
                label="Account number"
                value={values.accountNumber}
                onChangeText={set('accountNumber')}
                placeholder="0123456789"
                keyboardType="number-pad"
                maxLength={10}
                error={errors.accountNumber}
              />
              <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
                <AppText style={[styles.hint, { color: colors.primary }]}>
                  {/* Said plainly, because a member typing an account number is
                      entitled to know what happens to it. */}
                  Only the last four digits are stored with your application. We show the full
                  number to nobody, including our reviewers.
                </AppText>
              </View>
            </AppCard>
          </AppSection>
        ) : null}

        {step === 'review' ? (
          <>
            <AppSection title="WHAT YOU ARE SENDING">
              <AppCard style={styles.form}>
                <ReviewRow label="Name" value={values.contactName} />
                <ReviewRow label="Phone" value={values.contactPhone} />
                <ReviewRow label="WhatsApp" value={values.whatsappPhone} />
                {values.businessName.trim() ? (
                  <ReviewRow label="Business" value={values.businessName} />
                ) : (
                  <ReviewRow label="Business" value="Applying as an individual" />
                )}
                {values.nin.trim() ? (
                  <ReviewRow label="NIN" value={maskIdentityNumber(values.nin)} />
                ) : null}
                <ReviewRow
                  label="Address"
                  value={`${values.addressLine}, ${values.city}, ${values.state}`}
                />
                <ReviewRow
                  label="Fulfilment"
                  value={
                    FULFILMENT_OPTIONS.find((option) => option.value === values.fulfilment)
                      ?.label ?? values.fulfilment
                  }
                />
                <ReviewRow label="Bank" value={bankName ?? values.bankCode} />
                <ReviewRow label="Account" value={maskAccountNumber(values.accountNumber)} />
              </AppCard>
            </AppSection>

            <AppSection title="BEFORE YOU APPLY">
              <AppCard style={styles.form}>
                {/* Stated here rather than discovered at rejection: approval
                    requires verified Tier 3 KYC, which is a separate journey. */}
                <View style={styles.requirement}>
                  <AppMedallion icon="shield-checkmark-outline" tone="warning" size={36} />
                  <View style={styles.requirementText}>
                    <AppText weight="semibold">Full verification is required</AppText>
                    <AppText style={{ color: colors.textMuted }}>
                      Your application can only be approved once your identity is fully verified.
                      You can finish that from your profile.
                    </AppText>
                  </View>
                </View>

                <AppCheckbox
                  checked={values.verificationConsent}
                  onChange={set('verificationConsent')}
                  label="I consent to verification of these details"
                >
                  <AppText>
                    I agree that Ajo Cloud may verify my identity, address and settlement details.
                  </AppText>
                </AppCheckbox>
                {errors.verificationConsent ? (
                  <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
                    {errors.verificationConsent}
                  </AppText>
                ) : null}

                <AppCheckbox
                  checked={values.termsAccepted}
                  onChange={set('termsAccepted')}
                  label="I accept the coordinator terms"
                >
                  <AppText>
                    I accept the coordinator terms, including my responsibility for food I handle on
                    behalf of members.
                  </AppText>
                </AppCheckbox>
                {errors.termsAccepted ? (
                  <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
                    {errors.termsAccepted}
                  </AppText>
                ) : null}
              </AppCard>
            </AppSection>
          </>
        ) : null}

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
            <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
              {error.message}
            </AppText>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      >
        {stepIndex > 0 ? (
          <AppButton
            label="Back"
            variant="outline"
            onPress={() => {
              setStepIndex((index) => index - 1);
              setTouched(false);
            }}
            style={styles.footerAction}
          />
        ) : null}
        <AppButton
          label={isLast ? 'Submit application' : 'Continue'}
          onPress={advance}
          loading={submitting}
          style={styles.footerAction}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.reviewRow}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight="semibold" style={styles.reviewValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  progress: { gap: spacing.sm },
  stepLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },
  form: { gap: spacing.md },
  hint: { fontSize: fontSizes.caption },
  notice: { borderRadius: radius.md, padding: spacing.md },
  requirement: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  requirementText: { flex: 1, gap: 2 },
  reviewRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  reviewValue: { flexShrink: 1, textAlign: 'right' },
  footer: { borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  footerAction: { flex: 1 },
});
