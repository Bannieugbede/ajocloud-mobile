import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { completePasswordReset } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { AuthFormScreen } from './auth-form-screen';
import { FieldIcon } from './field-icon';
import { PasswordInput } from './password-input';

const schema = z
  .object({
    code: z.string().trim().length(6, 'Enter the six-digit code'),
    // Mirrors the backend policy so the rule is not weakened here.
    password: z.string().min(12, 'Use at least 12 characters').max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordScreen({
  challengeId,
  destinationMasked,
  onReset,
}: {
  challengeId: string;
  destinationMasked: string;
  onReset: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });
  const mutation = useMutation({ mutationFn: completePasswordReset, onSuccess: onReset });

  return (
    <AuthFormScreen
      title="Choose a new password"
      description={`Enter the code sent to ${destinationMasked} and your new password.`}
      error={(mutation.error as AppError | null)?.message}
    >
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <AppInput
              label="Verification code"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              icon={<FieldIcon name="code" />}
              autoComplete="one-time-code"
              keyboardType="number-pad"
              maxLength={6}
              editable={!mutation.isPending}
            />
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordInput
              label="New password"
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
              label="Confirm new password"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              editable={!mutation.isPending}
            />
          )}
        />
        <AppButton
          label="Update password"
          loading={mutation.isPending}
          onPress={() =>
            void form.handleSubmit((values) =>
              mutation.mutate({
                challengeId,
                code: values.code.trim(),
                password: values.password,
              }),
            )()
          }
        />
      </View>
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({ form: { gap: spacing.md } });
