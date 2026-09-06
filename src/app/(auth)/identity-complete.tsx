import { router, useLocalSearchParams } from 'expo-router';

import { IdentityCompleteStep } from '@/features/registration/identity-complete-step';
import { useRegistrationStore } from '@/store/registration-store';

/**
 * The end of identity verification, reached two ways.
 *
 * During registration the next thing is the last onboarding step. A signed-in
 * member who came from Profile has no onboarding left to do, so continuing has
 * to return them to Profile — where the verified badge they just earned is.
 */
export default function IdentityCompleteRoute() {
  const { requiresReview } = useLocalSearchParams<{ requiresReview?: string }>();
  const registering = useRegistrationStore((state) => state.step !== null);

  return (
    <IdentityCompleteStep
      requiresReview={requiresReview === '1'}
      onContinue={() =>
        registering ? router.replace('/(auth)/intent') : router.replace('/(tabs)/profile')
      }
    />
  );
}
