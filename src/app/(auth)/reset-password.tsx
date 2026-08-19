import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ResetPasswordScreen } from '@/features/auth/reset-password-screen';

export default function ResetPasswordRoute() {
  const { challengeId, destinationMasked } = useLocalSearchParams<{
    challengeId: string;
    destinationMasked: string;
  }>();

  return (
    <ResetPasswordScreen
      challengeId={challengeId}
      destinationMasked={destinationMasked}
      onReset={() => {
        // Every session was revoked by the reset, so the only way on is a fresh
        // sign-in.
        Alert.alert('Password updated', 'Sign in with your new password.', [
          { text: 'Sign in', onPress: () => router.replace('/(auth)/sign-in') },
        ]);
      }}
    />
  );
}
