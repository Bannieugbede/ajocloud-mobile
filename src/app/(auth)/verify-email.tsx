import { router, useLocalSearchParams } from 'expo-router';

import { VerificationScreen } from '@/features/auth/verification-screen';
import { saveTokenPair } from '@/features/auth/session';
import { challengeFromParams } from './verify-phone';

export default function VerifyEmailRoute() {
  const params = useLocalSearchParams<Record<string, string>>();
  return (
    <VerificationScreen
      initialChallenge={challengeFromParams(params, 'EMAIL')}
      onEmailVerified={(tokens) => {
        void saveTokenPair(tokens).then(() => router.replace('/(tabs)'));
      }}
    />
  );
}
