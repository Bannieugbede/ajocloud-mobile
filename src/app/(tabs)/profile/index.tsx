import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logout } from '@/api/endpoints/auth';
import { getKycStatus } from '@/api/endpoints/kyc';
import { getReferralSummary } from '@/api/endpoints/referrals';
import { getCurrentUser } from '@/api/endpoints/users';
import { ProfileMenuScreen } from '@/features/profile/profile-menu-screen';
import { clearSession } from '@/services/session-storage';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeStore } from '@/store/theme-store';

export default function ProfileRoute() {
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: 1 });
  // Failure here must not block the menu: verification status is extra
  // information, not what the screen is for.
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: getKycStatus, retry: 1 });
  const referrals = useQuery({
    queryKey: ['referral-summary'],
    queryFn: getReferralSummary,
    retry: 1,
  });
  // Read only to describe the Dark Mode row; changing it happens on the
  // Appearance screen the row opens.
  const themePreference = useThemeStore((state) => state.preference);

  const signOut = useMutation({
    mutationFn: async () => {
      try {
        await logout();
      } finally {
        // Cleared even if the request failed: a token the server may still
        // honour must not be left on the device.
        await clearSession();
      }
    },
    onSuccess: () => {
      queryClient.clear();
      useOnboardingStore.getState().reset();
      router.replace('/(auth)/onboarding');
    },
  });

  return (
    <ProfileMenuScreen
      {...(user.data ? { user: user.data } : {})}
      {...(kyc.data ? { kyc: kyc.data } : {})}
      {...(referrals.data ? { referrals: referrals.data } : {})}
      loading={user.isPending}
      signingOut={signOut.isPending}
      themePreference={themePreference}
      onOpenSettings={() => router.push('/(tabs)/profile/settings')}
      // Bank accounts are linked during identity verification, which is the
      // only flow that can add one, so the row opens that rather than a
      // read-only list nobody could act on.
      onOpenBankAccounts={() => router.push('/(auth)/verify-identity')}
      onOpenReferrals={() => router.push('/(tabs)/profile/referrals')}
      onOpenTransactions={() => router.push('/(tabs)/profile/transactions')}
      onOpenAppearance={() => router.push('/(tabs)/profile/appearance')}
      onOpenFees={() => router.push('/(tabs)/profile/fees')}
      onOpenSupport={() => router.push('/(tabs)/profile/support')}
      onCompleteKyc={() => router.push('/(tabs)/profile/verification')}
      onSignOut={() => signOut.mutate()}
    />
  );
}
