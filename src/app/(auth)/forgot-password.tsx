import { router } from 'expo-router';

import { ForgotPasswordScreen } from '@/features/auth/forgot-password-screen';

export default function ForgotPasswordRoute() {
  return (
    <ForgotPasswordScreen
      onCodeSent={(challenge) =>
        router.push({
          pathname: '/(auth)/reset-password',
          params: {
            challengeId: challenge.challengeId,
            destinationMasked: challenge.destinationMasked,
          },
        })
      }
    />
  );
}
