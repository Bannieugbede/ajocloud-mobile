import { router, useLocalSearchParams } from 'expo-router';

import { IdentityCompleteStep } from '@/features/registration/identity-complete-step';

export default function IdentityCompleteRoute() {
  const { requiresReview } = useLocalSearchParams<{ requiresReview?: string }>();

  return (
    <IdentityCompleteStep
      requiresReview={requiresReview === '1'}
      onContinue={() => router.replace('/(auth)/intent')}
    />
  );
}
