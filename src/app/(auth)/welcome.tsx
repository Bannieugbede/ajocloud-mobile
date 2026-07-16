import { router } from 'expo-router';

import { WelcomeScreen } from '@/features/onboarding/welcome-screen';

export default function WelcomeRoute() {
  return (
    <WelcomeScreen
      onCreateAccount={() => router.push('/(onboarding)/introduction?next=register')}
      onLearn={() => router.push('/(onboarding)/introduction')}
      onPrivacy={() => router.push('/(public)/legal/privacy')}
      onSignIn={() => router.push('/(onboarding)/introduction?next=sign-in')}
      onTerms={() => router.push('/(public)/legal/terms')}
    />
  );
}
