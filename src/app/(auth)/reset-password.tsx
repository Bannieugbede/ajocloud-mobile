import { router, useLocalSearchParams } from 'expo-router';

import { toast } from '@/components/ui/app-toast';
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
        toast.success('Sign in with your new password.', { title: 'Password updated' });
        router.replace('/(auth)/sign-in');
      }}
    />
  );
}
