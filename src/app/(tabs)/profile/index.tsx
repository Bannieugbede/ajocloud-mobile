import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { logout } from '@/api/endpoints/auth';
import { getKycStatus } from '@/api/endpoints/kyc';
import { getCurrentUser } from '@/api/endpoints/users';
import { ProfileMenuScreen } from '@/features/profile/profile-menu-screen';
import { clearSession } from '@/services/session-storage';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function ProfileRoute() {
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: 1 });
  // Failure here must not block the menu: verification status is extra
  // information, not what the screen is for.
  const kyc = useQuery({ queryKey: ['kyc-status'], queryFn: getKycStatus, retry: 1 });

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
      loading={user.isPending}
      signingOut={signOut.isPending}
      onEditProfile={() => router.push('/(tabs)/profile/edit')}
      onOpenSecurity={() => router.push('/(tabs)/profile/security')}
      onOpenNotifications={() => router.push('/(tabs)/profile/notifications')}
      onOpenSupport={() => router.push('/(tabs)/profile/support')}
      onOpenLegal={() => router.push('/(public)/legal/privacy')}
      onCompleteKyc={() => router.push('/(auth)/verify-identity')}
      onSignOut={() => signOut.mutate()}
    />
  );
}
