import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { login, type TokenPair } from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { fontSizes, spacing } from '@/theme';
import { AuthFormScreen } from './auth-form-screen';
import { FieldIcon } from './field-icon';
import { GoogleButton } from './google-button';
import { GoogleSignInCancelled, signInWithGoogle } from './google-sign-in';
import { PasswordInput } from './password-input';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password').max(128),
});
type FormValues = z.infer<typeof schema>;

export function SignInScreen({
  onSignedIn,
  onRegister,
  onForgotPassword,
}: {
  onSignedIn: (tokens: TokenPair) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}) {
  const { colors } = useTheme();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const mutation = useMutation({ mutationFn: login, onSuccess: (tokens) => onSignedIn(tokens) });
  const google = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (tokens) => onSignedIn(tokens),
  });

  // Dismissing the browser is a deliberate choice, not an error to report.
  const googleError =
    google.error instanceof GoogleSignInCancelled
      ? undefined
      : (google.error as AppError | null)?.message;

  return (
    <AuthFormScreen
      title="Welcome back"
      description="Use your verified email address and password to continue."
      error={(mutation.error as AppError | null)?.message ?? googleError}
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
              labelAccessory={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Forgot your password?"
                  hitSlop={spacing.sm}
                  onPress={onForgotPassword}
                  testID="forgot-password-link"
                >
                  <AppText weight="semibold" style={[styles.forgot, { color: colors.link }]}>
                    Forgot password?
                  </AppText>
                </Pressable>
              }
            />
          )}
        />
        <AppButton
          label="Sign in"
          loading={mutation.isPending}
          disabled={google.isPending}
          onPress={() =>
            void form.handleSubmit((values) =>
              mutation.mutate({
                email: values.email.trim().toLowerCase(),
                password: values.password,
              }),
            )()
          }
        />

        <View accessibilityElementsHidden importantForAccessibility="no" style={styles.divider}>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <AppText style={[styles.dividerLabel, { color: colors.textSubtle }]}>or</AppText>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </View>

        <GoogleButton
          loading={google.isPending}
          disabled={mutation.isPending}
          onPress={() => google.mutate()}
        />
      </View>
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  forgot: { fontSize: fontSizes.caption },
  divider: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  rule: { flex: 1, height: 1 },
  dividerLabel: { fontSize: fontSizes.caption },
});
