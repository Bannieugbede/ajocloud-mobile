import { router, useLocalSearchParams } from 'expo-router';

import type { VerificationChallenge } from '@/api/endpoints/auth';
import { VerificationScreen } from '@/features/auth/verification-screen';

export default function VerifyPhoneRoute() {
  const params = useLocalSearchParams<Record<string, string>>();
  return (
    <VerificationScreen
      initialChallenge={challengeFromParams(params, 'PHONE')}
      onPhoneVerified={(challenge) =>
        router.replace({ pathname: '/(auth)/verify-email', params: challenge })
      }
    />
  );
}

export function challengeFromParams(
  params: Record<string, string>,
  channel: 'PHONE' | 'EMAIL',
): VerificationChallenge {
  return {
    userId: params.userId ?? '',
    channel,
    destinationMasked: params.destinationMasked ?? 'your contact',
    expiresAt: params.expiresAt ?? new Date(0).toISOString(),
    resendAvailableAt: params.resendAvailableAt ?? new Date(0).toISOString(),
    deliveryStatus: params.deliveryStatus === 'FAILED' ? 'FAILED' : 'SENT',
  };
}
