import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Linking, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { registerAccount, type VerificationChallenge } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppCheckbox } from '@/components/ui/app-checkbox';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { environment } from '@/config/environment';
import { FieldIcon } from '@/features/auth/field-icon';
import { PasswordInput } from '@/features/auth/password-input';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { StepScreen } from './step-screen';

/** Mirrors the backend contract: E.164 with a country code, no separators. */
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

const schema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter your first name').max(100),
    lastName: z.string().trim().min(1, 'Enter your last name').max(100),
    phone: z.string().trim().regex(PHONE_PATTERN, 'Use international format, e.g. +2348012345678'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z.string().min(12, 'Use at least 12 characters').max(128),
    confirmPassword: z.string(),
    referralCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{4,32}$/, 'Use 4-32 letters, digits or -')
      .optional()
      .or(z.literal('')),
    acceptedPrivacy: z.literal(true, { error: 'Accept the Privacy Policy to continue' }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export function DetailsStep({
  onRegistered,
  onSignIn,
}: {
  onRegistered: (challenge: VerificationChallenge) => void;
  onSignIn: () => void;
}) {
  const { colors } = useTheme();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
      acceptedPrivacy: false as never,
    },
  });
  const mutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (challenge) => onRegistered(challenge),
  });

  const submit = form.handleSubmit((values) => {
    const referralCode = values.referralCode?.trim();
    mutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      // Omitted entirely when blank, so the backend sees "not supplied".
      ...(referralCode ? { referralCode } : {}),
      acceptedPrivacy: true,
    });
  });

  const privacyUrl = environment.EXPO_PUBLIC_PRIVACY_URL;

  return (
    <StepScreen
      step="details"
      title="Create your account"
      description="We'll email you a code to confirm it's really you."
      error={(mutation.error as AppError | null)?.message}
      footer={
        <AppButton label="Already have an account? Sign in" variant="ghost" onPress={onSignIn} />
      }
    >
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <AppInput
              label="First name"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              icon={<FieldIcon name="person" />}
              autoCapitalize="words"
              autoComplete="given-name"
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <AppInput
              label="Last name"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              icon={<FieldIcon name="person" />}
              autoCapitalize="words"
              autoComplete="family-name"
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <AppInput
              label="Phone number"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              icon={<FieldIcon name="phone" />}
              placeholder="+2348012345678"
              autoComplete="tel"
              keyboardType="phone-pad"
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <AppInput
              label="Email address"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              icon={<FieldIcon name="mail" />}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordInput
              label="Password"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <PasswordInput
              label="Confirm password"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="referralCode"
          render={({ field, fieldState }) => (
            <AppInput
              label="Referral code (optional)"
              value={field.value ?? ''}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              icon={<FieldIcon name="gift" />}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="acceptedPrivacy"
          render={({ field, fieldState }) => (
            <View style={styles.consent}>
              <AppCheckbox
                checked={field.value === true}
                onChange={field.onChange}
                label="I accept the Privacy Policy"
                disabled={mutation.isPending}
                testID="accept-privacy"
              >
                <AppText
                  onPress={privacyUrl ? () => void Linking.openURL(privacyUrl) : undefined}
                  style={privacyUrl ? { color: colors.link } : undefined}
                >
                  I accept the Privacy Policy
                </AppText>
              </AppCheckbox>
              {fieldState.error ? (
                <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
                  {fieldState.error.message}
                </AppText>
              ) : null}
            </View>
          )}
        />
        <AppButton
          label="Create account"
          loading={mutation.isPending}
          onPress={() => void submit()}
        />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  consent: { gap: spacing.xs },
});
