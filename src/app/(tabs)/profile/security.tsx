import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { setTransactionPin, transactionPinStatus } from '@/api/endpoints/auth';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { SecurityScreen } from '@/features/profile/security-screen';
import { getBiometricAvailability } from '@/services/biometric-unlock';
import { useBiometricStore } from '@/store/biometric-store';
import type { AppError } from '@/types/errors';

export default function SecurityRoute() {
  const queryClient = useQueryClient();
  const pin = useQuery({ queryKey: ['transaction-pin'], queryFn: transactionPinStatus });
  // Device capability, not a preference: the toggle is hidden entirely where
  // there is no sensor rather than offered and then failing.
  const biometrics = useQuery({
    queryKey: ['biometric-availability'],
    queryFn: getBiometricAvailability,
  });
  const enabled = useBiometricStore((state) => state.enabled);
  const setEnabled = useBiometricStore((state) => state.setEnabled);

  const save = useMutation({
    mutationFn: (input: { pin: string; currentPin?: string }) => setTransactionPin(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transaction-pin'] });
    },
  });

  if (pin.isPending) return <AppLoadingState label="Loading your security settings" />;
  if (pin.isError || !pin.data) {
    return (
      <AppErrorState
        description="Could not load your security settings."
        onRetry={() => void pin.refetch()}
      />
    );
  }

  return (
    <SecurityScreen
      hasPin={pin.data.isSet}
      lockedUntil={pin.data.lockedUntil}
      biometricsAvailable={biometrics.data?.available ?? false}
      biometricsEnabled={enabled}
      submitting={save.isPending}
      error={save.error as AppError | null}
      saved={save.isSuccess}
      onToggleBiometrics={setEnabled}
      onSubmit={(input) => save.mutate(input)}
    />
  );
}
