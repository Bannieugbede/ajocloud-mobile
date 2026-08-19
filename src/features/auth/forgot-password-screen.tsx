import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { requestPasswordReset, type PasswordResetChallenge } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { AuthFormScreen } from './auth-form-screen';
import { FieldIcon } from './field-icon';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address') });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordScreen({
  onCodeSent,
}: {
  onCodeSent: (challenge: PasswordResetChallenge) => void;
}) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (challenge) => onCodeSent(challenge),
  });

  return (
    <AuthFormScreen
      title="Reset your password"
      // The backend answers identically for unknown addresses, so the copy must
      // not imply the address was found.
      description="Enter your email address. If it matches an account with a password, we will send a six-digit code."
      error={(mutation.error as AppError | null)?.message}
    >
      <View style={styles.form}>
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
        <AppButton
          label="Send reset code"
          loading={mutation.isPending}
          onPress={() =>
            void form.handleSubmit((values) => mutation.mutate(values.email.trim().toLowerCase()))()
          }
        />
      </View>
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.md } });
