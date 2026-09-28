import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';

import { verifyAddress } from '@/api/endpoints/kyc';
import { backTo } from '@/components/ui/app-header-back';
import { toast } from '@/components/ui/app-toast';
import { KYC_STATUS_KEY } from '@/features/kyc/kyc-gate';
import { VERIFICATION_ROUTE } from '@/features/kyc/kyc-stages';
import { AddressForm } from '@/features/kyc/verification-forms';
import type { AppError } from '@/types/errors';

export default function AddressRoute() {
  const queryClient = useQueryClient();
  const verify = useMutation({
    mutationFn: verifyAddress,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: KYC_STATUS_KEY });
      if (result.status === 'VERIFIED') {
        toast.success('Your address is verified. You are fully verified.');
      } else {
        toast.info('Your address is with a reviewer. We will let you know.');
      }
      router.dismissTo(VERIFICATION_ROUTE);
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Verify Address', ...backTo(VERIFICATION_ROUTE) }} />
      <AddressForm
        submitting={verify.isPending}
        error={verify.error as AppError | null}
        onSubmit={(values) => verify.mutate(values)}
      />
    </>
  );
}
