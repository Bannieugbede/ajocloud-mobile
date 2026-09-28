import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { getKycStatus, type KycAction, type KycStatus } from '@/api/endpoints/kyc';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

import {
  STAGE_TITLES,
  VERIFICATION_ROUTE,
  canPerform,
  lockedMessage,
  requiredStage,
} from './kyc-stages';

/** Shared with the Profile screen, so one fetch serves both. */
export const KYC_STATUS_KEY = ['kyc-status'] as const;

export function useKycStatus() {
  return useQuery({ queryKey: KYC_STATUS_KEY, queryFn: getKycStatus, staleTime: 30_000 });
}

/**
 * Renders `children` only once the member has reached the stage `action`
 * needs; otherwise says which stage and offers the way there.
 *
 * Fails closed: if the status cannot be read, the form is not shown. The
 * server refuses the action regardless, so showing it would only waste the
 * member's typing.
 */
export function KycGate({ action, children }: { action: KycAction; children: ReactNode }) {
  const { colors } = useTheme();
  const status = useKycStatus();

  if (status.isPending) return <AppLoadingState label="Checking your verification" />;
  if (status.isError) {
    return (
      <AppErrorState
        title="Could not check your verification"
        onRetry={() => void status.refetch()}
      />
    );
  }
  if (canPerform(action, status.data)) return <>{children}</>;

  const stage = requiredStage(action, status.data);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.locked}
      style={{ backgroundColor: colors.background }}
    >
      <AppEmptyState
        icon="shield-checkmark-outline"
        title={
          status.data.restricted
            ? 'Verification not approved'
            : `Stage ${stage} (${STAGE_TITLES[stage]}) required`
        }
        description={lockedMessage(action, status.data)}
        testID="kyc-gate-locked"
        {...(status.data.restricted
          ? {}
          : {
              action: 'Continue verification',
              onAction: () => router.push(VERIFICATION_ROUTE),
            })}
      />
    </ScrollView>
  );
}

/**
 * For an action started from a button rather than a screen: `ensure` returns
 * true when the member may go ahead, and otherwise explains and offers the
 * verification screen. While the status is still loading it lets the action
 * through, since the server has the final word either way.
 */
export function useKycCheck() {
  const status = useKycStatus();
  const data: KycStatus | undefined = status.data;

  const ensure = useCallback(
    (action: KycAction): boolean => {
      if (!data || canPerform(action, data)) return true;
      Alert.alert(
        'Verification needed',
        lockedMessage(action, data),
        data.restricted
          ? [{ text: 'OK' }]
          : [
              { text: 'Not now', style: 'cancel' },
              { text: 'Continue', onPress: () => router.push(VERIFICATION_ROUTE) },
            ],
      );
      return false;
    },
    [data],
  );

  return { ensure, status: data };
}

const styles = StyleSheet.create({
  locked: { flexGrow: 1, justifyContent: 'center', padding: spacing.md },
});
