import { router } from 'expo-router';

import { IdentityIntroStep } from '@/features/registration/identity-intro-step';
import { useRegistrationStore } from '@/store/registration-store';

/**
 * The identity introduction, reached two ways.
 *
 * During registration it is a step, and skipping it moves on to the last one.
 * From Profile — "KYC Verification", or linking a bank account — the member is
 * already signed in and `step` is null, so skipping has to return them to
 * Profile rather than push them through the end of an onboarding they finished
 * long ago.
 */
export default function VerifyIdentityRoute() {
  const registering = useRegistrationStore((state) => state.step !== null);

  return (
    <IdentityIntroStep
      onStart={() => router.replace('/(auth)/personal-details')}
      onSkip={() =>
        registering ? router.replace('/(auth)/intent') : router.replace('/(tabs)/profile')
      }
    />
  );
}
