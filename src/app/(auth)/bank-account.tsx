import { router, useLocalSearchParams } from 'expo-router';

import { BankAccountStep } from '@/features/registration/bank-account-step';

export default function BankAccountRoute() {
  const { requiresReview } = useLocalSearchParams<{ requiresReview?: string }>();

  return (
    <BankAccountStep
      onLinked={() =>
        router.replace({
          pathname: '/(auth)/identity-complete',
          params: { requiresReview: requiresReview ?? '0' },
        })
      }
    />
  );
}
