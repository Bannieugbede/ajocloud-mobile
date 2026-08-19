import { router, useLocalSearchParams } from 'expo-router';

import type { VerificationChallenge } from '@/api/endpoints/auth';
import { VerificationScreen } from '@/features/auth/verification-screen';
import { saveTokenPair } from '@/features/auth/session';
import { useRegistrationStore } from '@/store/registration-store';

export default function VerifyEmailRoute() {
  const params = useLocalSearchParams<Record<string, string>>();
  const markEmailVerified = useRegistrationStore((state) => state.markEmailVerified);

  return (
    <VerificationScreen
      initialChallenge={challengeFromParams(params)}
      onEmailVerified={(tokens) => {
        // The session must exist before the PIN step: setting a PIN is an
        // authenticated call.
        void saveTokenPair(tokens).then(() => {
          markEmailVerified();
          router.replace('/(auth)/create-pin');
        });
      }}
    />
  );
}

function challengeFromParams(params: Record<string, string>): VerificationChallenge {
  return {
    userId: params.userId ?? '',
    channel: 'EMAIL',
    destinationMasked: params.destinationMasked ?? 'your email address',
    expiresAt: params.expiresAt ?? new Date(0).toISOString(),
    resendAvailableAt: params.resendAvailableAt ?? new Date(0).toISOString(),
    deliveryStatus: params.deliveryStatus === 'FAILED' ? 'FAILED' : 'SENT',
  };
}
