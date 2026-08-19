import { router } from 'expo-router';

import { saveTokenPair } from '@/features/auth/session';
import { SignInScreen } from '@/features/auth/sign-in-screen';

export default function SignInRoute() {
  return (
    <SignInScreen
      onForgotPassword={() => router.push('/(auth)/forgot-password')}
      onRegister={() => router.replace('/(auth)/register')}
      onSignedIn={(tokens) => {
        void saveTokenPair(tokens).then(() => router.replace('/(tabs)/home'));
      }}
    />
  );
}
