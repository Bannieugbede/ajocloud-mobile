import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';

import { uploadIdentityDocument } from '@/api/endpoints/kyc';
import { backTo } from '@/components/ui/app-header-back';
import { KYC_STATUS_KEY } from '@/features/kyc/kyc-gate';
import { VERIFICATION_ROUTE } from '@/features/kyc/kyc-stages';
import { DocumentForm } from '@/features/kyc/verification-forms';
import type { AppError } from '@/types/errors';

export default function DocumentRoute() {
  const queryClient = useQueryClient();
  const upload = useMutation({
    meta: { successMessage: 'Your NIN document is uploaded.' },
    mutationFn: uploadIdentityDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KYC_STATUS_KEY });
      router.dismissTo(VERIFICATION_ROUTE);
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'NIN Document', ...backTo(VERIFICATION_ROUTE) }} />
      <DocumentForm
        submitting={upload.isPending}
        error={upload.error as AppError | null}
        onSubmit={(values) => upload.mutate(values)}
      />
    </>
  );
}
