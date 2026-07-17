import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { login, type TokenPair } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { AuthFormScreen } from './auth-form-screen';
import { PasswordInput } from './password-input';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password').max(128),
});
type FormValues = z.infer<typeof schema>;

export function SignInScreen({
  onSignedIn,
  onRegister,
}: {
  onSignedIn: (tokens: TokenPair) => void;
  onRegister: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const mutation = useMutation({ mutationFn: login, onSuccess: (tokens) => onSignedIn(tokens) });
  return (
    <AuthFormScreen
      title="Welcome back"
      description="Use your verified email address and password to continue."
      error={(mutation.error as AppError | null)?.message}
      footer={<AppButton label="Create a new account" variant="ghost" onPress={onRegister} />}
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
        <AppButton
          label="Sign in"
          loading={mutation.isPending}
          onPress={() =>
            void form.handleSubmit((values) =>
              mutation.mutate({
                email: values.email.trim().toLowerCase(),
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
