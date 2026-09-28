import { Stack, router } from 'expo-router';
import type { Href } from 'expo-router';

import type { KycRequirementKey } from '@/api/endpoints/kyc';
import { backTo } from '@/components/ui/app-header-back';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { useKycStatus } from '@/features/kyc/kyc-gate';
import { VerificationScreen } from '@/features/kyc/verification-screen';

const ROUTES: Partial<Record<KycRequirementKey, Href>> = {
  basicInfo: '/(tabs)/profile/verification/basic',
  // The PIN is set where it is changed, on the Security screen.
  pin: '/(tabs)/profile/security',
  nin: '/(tabs)/profile/verification/nin',
  ninDocument: '/(tabs)/profile/verification/document',
  address: '/(tabs)/profile/verification/address',
};

/** The member's verification stages. Reached from Profile and from every gate. */
export default function VerificationRoute() {
  const status = useKycStatus();

  return (
    <>
      <Stack.Screen options={{ title: 'Verification', ...backTo('/(tabs)/profile') }} />
      {status.isPending ? (
        <AppLoadingState label="Loading your verification" />
      ) : status.isError ? (
        <AppErrorState
          title="Could not load your verification"
          onRetry={() => void status.refetch()}
        />
      ) : (
        <VerificationScreen
          status={status.data}
          refreshing={status.isRefetching}
          onRefresh={() => void status.refetch()}
          onOpen={(key) => {
            const route = ROUTES[key];
            if (route) router.push(route);
          }}
        />
      )}
    </>
  );
}
