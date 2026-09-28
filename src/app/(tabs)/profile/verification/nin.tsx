import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';

import { verifyIdentity } from '@/api/endpoints/kyc';
import { backTo } from '@/components/ui/app-header-back';
import { KYC_STATUS_KEY } from '@/features/kyc/kyc-gate';
import { VERIFICATION_ROUTE } from '@/features/kyc/kyc-stages';
import { NinForm } from '@/features/kyc/verification-forms';
import type { AppError } from '@/types/errors';

export default function NinRoute() {
  const queryClient = useQueryClient();
  const verify = useMutation({
    mutationFn: (identityNumber: string) =>
      verifyIdentity({ kind: 'NIN', identityNumber, consent: true }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: KYC_STATUS_KEY });
      // Straight on to the document when the NIN passed; back to the stages
      // when it is waiting on a reviewer, so the member sees it is held.
      if (result.requiresReview) router.dismissTo(VERIFICATION_ROUTE);
      else router.replace('/(tabs)/profile/verification/document');
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Verify NIN', ...backTo(VERIFICATION_ROUTE) }} />
      <NinForm
        submitting={verify.isPending}
        error={verify.error as AppError | null}
        onSubmit={({ identityNumber }) => verify.mutate(identityNumber)}
      />
    </>
  );
}
