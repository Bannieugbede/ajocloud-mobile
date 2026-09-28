import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';

import { updateBasicInfo } from '@/api/endpoints/kyc';
import { backTo } from '@/components/ui/app-header-back';
import { KYC_STATUS_KEY } from '@/features/kyc/kyc-gate';
import { VERIFICATION_ROUTE } from '@/features/kyc/kyc-stages';
import { BasicInfoForm } from '@/features/kyc/verification-forms';
import type { AppError } from '@/types/errors';

export default function BasicInfoRoute() {
  const queryClient = useQueryClient();
  const save = useMutation({
    meta: { successMessage: 'Your details are saved.' },
    mutationFn: updateBasicInfo,
    onSuccess: (status) => {
      queryClient.setQueryData(KYC_STATUS_KEY, status);
      router.dismissTo(VERIFICATION_ROUTE);
    },
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Basic Details', ...backTo(VERIFICATION_ROUTE) }} />
      <BasicInfoForm
        submitting={save.isPending}
        error={save.error as AppError | null}
        onSubmit={(values) => save.mutate(values)}
      />
    </>
  );
}
