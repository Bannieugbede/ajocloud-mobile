import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Linking, StyleSheet, Switch, View } from 'react-native';
import { z } from 'zod';

import { registerAccount, type VerificationChallenge } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { environment } from '@/config/environment';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { AuthFormScreen } from './auth-form-screen';
import { PasswordInput } from './password-input';

const schema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter your first name').max(100),
    lastName: z.string().trim().min(1, 'Enter your last name').max(100),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().regex(/^\+234[789]\d{9}$/, 'Use a Nigerian number in +234 format'),
    password: z.string().min(12, 'Use at least 12 characters').max(128),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, { error: 'Accept the Terms of Service' }),
    acceptedPrivacy: z.literal(true, { error: 'Accept the Privacy Policy' }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export function RegisterScreen({
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
      email: '',
      phone: '+234',
      password: '',
      confirmPassword: '',
      acceptedTerms: false as never,
      acceptedPrivacy: false as never,
    },
  });
  const mutation = useMutation({
    mutationFn: registerAccount,
    onSuccess: (challenge) => onRegistered(challenge),
  });
  const submit = form.handleSubmit((values) =>
    mutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone,
      password: values.password,
      acceptedTerms: true,
      acceptedPrivacy: true,
    }),
  );

  return (
    <AuthFormScreen
      title="Create your account"
      description="Enter your details to begin secure phone and email verification."
      error={(mutation.error as AppError | null)?.message}
      footer={
        <AppButton label="Already have an account? Sign in" variant="ghost" onPress={onSignIn} />
      }
    >
      <View style={styles.form}>
        {(['firstName', 'lastName', 'email', 'phone'] as const).map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <AppInput
                label={
                  {
                    firstName: 'First name',
                    lastName: 'Last name',
                    email: 'Email address',
                    phone: 'Phone number',
                  }[name]
                }
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
                autoCapitalize={name === 'firstName' || name === 'lastName' ? 'words' : 'none'}
                autoComplete={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'name'}
                keyboardType={
                  name === 'email' ? 'email-address' : name === 'phone' ? 'phone-pad' : 'default'
                }
                editable={!mutation.isPending}
              />
            )}
          />
        ))}
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
        <ConsentRow
          control={form.control}
          name="acceptedTerms"
          label="I accept the Terms of Service"
          url={environment.EXPO_PUBLIC_TERMS_URL}
          disabled={mutation.isPending}
          colors={colors}
        />
        <ConsentRow
          control={form.control}
          name="acceptedPrivacy"
          label="I accept the Privacy Policy"
          url={environment.EXPO_PUBLIC_PRIVACY_URL}
          disabled={mutation.isPending}
          colors={colors}
        />
        <AppButton
          label="Create account"
          loading={mutation.isPending}
          onPress={() => void submit()}
        />
      </View>
    </AuthFormScreen>
  );
}

function ConsentRow({
  control,
  name,
  label,
  url,
  disabled,
  colors,
}: {
  control: ReturnType<typeof useForm<FormValues>>['control'];
  name: 'acceptedTerms' | 'acceptedPrivacy';
  label: string;
  url?: string;
  disabled: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.consentGroup}>
          <View style={styles.consentRow}>
            <Switch
              accessibilityLabel={label}
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
              trackColor={{ true: colors.primary }}
            />
            <AppText
              onPress={url ? () => void Linking.openURL(url) : undefined}
              style={url ? { color: colors.link } : undefined}
            >
              {label}
            </AppText>
          </View>
          {fieldState.error ? (
            <AppText style={{ color: colors.error }}>{fieldState.error.message}</AppText>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  consentGroup: { gap: spacing.xs },
  consentRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
});
