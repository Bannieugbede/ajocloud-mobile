import { router, useLocalSearchParams } from 'expo-router';

import type { VerificationChallenge } from '@/api/endpoints/auth';
import { VerificationScreen } from '@/features/auth/verification-screen';
import { saveTokenPair } from '@/features/auth/session';

export default function VerifyEmailRoute() {
  const params = useLocalSearchParams<Record<string, string>>();
  return (
    <VerificationScreen
      initialChallenge={challengeFromParams(params)}
      onEmailVerified={(tokens) => {
        void saveTokenPair(tokens).then(() => router.replace('/(tabs)/home'));
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
