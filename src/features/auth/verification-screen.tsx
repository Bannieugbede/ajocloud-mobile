import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import {
  resendVerification,
  type TokenPair,
  type VerificationChallenge,
  verifyEmail,
} from '@/api/endpoints/auth';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import type { AppError } from '@/types/errors';
import { spacing } from '@/theme';
import { AuthFormScreen } from './auth-form-screen';

const schema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the six-digit code') });

export function VerificationScreen({
  initialChallenge,
  onEmailVerified,
}: {
  initialChallenge: VerificationChallenge;
  onEmailVerified?: (tokens: TokenPair) => void;
}) {
  const { colors } = useTheme();
  const [challenge, setChallenge] = useState(initialChallenge);
  const [now, setNow] = useState(0);
  const form = useForm<{ code: string }>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  const verifyMutation = useMutation<TokenPair, AppError, { code: string }>({
    mutationFn: ({ code }: { code: string }) => verifyEmail(challenge.userId, code),
    onSuccess: (tokens) => onEmailVerified?.(tokens),
  });
  const resendMutation = useMutation({
    mutationFn: () => resendVerification(challenge.userId),
    onSuccess: (nextChallenge) => {
      setChallenge(nextChallenge);
      form.reset();
      setNow(Date.now());
    },
  });
  const cooldown = Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1_000));
  const expired = Date.parse(challenge.expiresAt) <= now;
  const error = (verifyMutation.error ?? resendMutation.error) as AppError | null;

  return (
    <AuthFormScreen
      title="Check your email"
      description={`Enter the six-digit code sent to ${challenge.destinationMasked}.`}
      error={error?.message}
    >
      <View style={styles.form}>
        {challenge.deliveryStatus === 'FAILED' ? (
          <AppText accessibilityLiveRegion="assertive" style={{ color: colors.warning }}>
            Delivery could not be confirmed. Use resend when it becomes available.
          </AppText>
        ) : null}
        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <AppInput
              label="Verification code"
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={(value) => field.onChange(value.replace(/\D/g, '').slice(0, 6))}
              error={fieldState.error?.message}
              autoComplete="one-time-code"
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              style={styles.code}
              editable={!verifyMutation.isPending}
            />
          )}
        />
        <AppText
          accessibilityLiveRegion="polite"
          style={{ color: expired ? colors.error : colors.textMuted }}
        >
          {expired ? 'This code has expired. Request a new one.' : 'Code expires in 10 minutes.'}
        </AppText>
        <AppButton
          label="Verify"
          loading={verifyMutation.isPending}
          disabled={expired || resendMutation.isPending}
          onPress={() => void form.handleSubmit((values) => verifyMutation.mutate(values))()}
        />
        <AppButton
          label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          variant="ghost"
          disabled={cooldown > 0 || verifyMutation.isPending}
          loading={resendMutation.isPending}
          onPress={() => resendMutation.mutate()}
        />
      </View>
    </AuthFormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  code: { fontSize: 24, letterSpacing: 12, textAlign: 'center' },
});
