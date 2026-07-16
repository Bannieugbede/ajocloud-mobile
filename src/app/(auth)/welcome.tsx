import { router } from 'expo-router';

import { WelcomeScreen } from '@/features/onboarding/welcome-screen';

export default function WelcomeRoute() {
  return (
    <WelcomeScreen
      onCreateAccount={() => router.push('/(onboarding)/introduction?next=register')}
      onLearn={() => router.push('/(onboarding)/introduction')}
      onSignIn={() => router.push('/(onboarding)/introduction?next=sign-in')}
    />
  );
}
