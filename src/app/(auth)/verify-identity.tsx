import { router } from 'expo-router';

import { IdentityIntroStep } from '@/features/registration/identity-intro-step';

export default function VerifyIdentityRoute() {
  return (
    <IdentityIntroStep
      onStart={() => router.replace('/(auth)/personal-details')}
      onSkip={() => router.replace('/(auth)/intent')}
    />
  );
}
