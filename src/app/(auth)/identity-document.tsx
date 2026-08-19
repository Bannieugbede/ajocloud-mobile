import { router } from 'expo-router';

import { IdentityDocumentStep } from '@/features/registration/identity-document-step';

export default function IdentityDocumentRoute() {
  return (
    <IdentityDocumentStep
      onVerified={(result) =>
        router.replace({
          pathname: '/(auth)/bank-account',
          // Only the review flag travels; the masked value is re-read from the
          // server on the next screen rather than passed through navigation.
          params: { requiresReview: result.requiresReview ? '1' : '0' },
        })
      }
    />
  );
}
