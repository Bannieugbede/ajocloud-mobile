import { router } from 'expo-router';

import { WelcomeScreen } from '@/features/auth/welcome-screen';

export default function WelcomeRoute() {
  return (
    <WelcomeScreen
      onCreateAccount={() => router.push('/(auth)/register')}
      onPrivacy={() => router.push('/(public)/legal/privacy')}
      onSignIn={() => router.push('/(auth)/sign-in')}
      onTerms={() => router.push('/(public)/legal/terms')}
    />
  );
}
