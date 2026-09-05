import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Alert, Share } from 'react-native';

import { listAkawoGoals } from '@/api/endpoints/akawo';
import { logout } from '@/api/endpoints/auth';
import { getKycStatus } from '@/api/endpoints/kyc';
import { getNotificationFeed } from '@/api/endpoints/notifications';
import { getReferralSummary } from '@/api/endpoints/referrals';
import { getCurrentUser } from '@/api/endpoints/users';
import { getWalletSummary, listWallets } from '@/api/endpoints/wallets';
import { totalAkawoSaved } from '@/features/home/home-data';
import { ProfileMenuScreen } from '@/features/profile/profile-menu-screen';
import { referralShareMessage } from '@/features/profile/referral-share';
import { clearSession } from '@/services/session-storage';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeStore } from '@/store/theme-store';

export default function ProfileRoute() {
  // Read here so the menu row can show an unread count without the user having
  // to open the inbox to discover there is something waiting.
  const feed = useQuery({
    queryKey: ['notification-feed'],
    queryFn: () => getNotificationFeed(),
  });
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
  const goals = useQuery({ queryKey: ['akawo-goals'], queryFn: listAkawoGoals, retry: 1 });
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets, retry: 1 });

  const walletId = wallets.data?.[0]?.id;
  const summary = useQuery({
    queryKey: ['wallet-summary', walletId],
    queryFn: () => getWalletSummary(walletId as string),
    enabled: Boolean(walletId),
  });

  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);

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

  const copyCode = (code: string) => {
    void Clipboard.setStringAsync(code).then(() => {
      // Confirmed explicitly: a copy that says nothing leaves the user unsure
      // whether it worked, and they cannot see the clipboard to check.
      Alert.alert('Copied', `Your referral code ${code} is on the clipboard.`);
    });
  };

  const shareCode = (code: string) => {
    void Share.share({ message: referralShareMessage(code) });
  };

  return (
    <ProfileMenuScreen
      {...(user.data ? { user: user.data } : {})}
      {...(kyc.data ? { kyc: kyc.data } : {})}
      {...(referrals.data ? { referrals: referrals.data } : {})}
      {...(summary.data ? { availableMinor: summary.data.availableMinor } : {})}
      savingsMinor={totalAkawoSaved(goals.data)}
      currency={summary.data?.currency ?? 'NGN'}
      loading={user.isPending}
      signingOut={signOut.isPending}
      themePreference={themePreference}
      onChangeTheme={setThemePreference}
      onCopyReferralCode={copyCode}
      onShareReferralCode={shareCode}
      onEditProfile={() => router.push('/(tabs)/profile/edit')}
      onOpenSecurity={() => router.push('/(tabs)/profile/security')}
      onOpenNotifications={() => router.push('/(tabs)/profile/notifications')}
      onOpenInbox={() => router.push('/(tabs)/notifications')}
      unreadCount={feed.data?.unreadCount ?? 0}
      // Bank accounts are linked during identity verification, which is the
      // only flow that can add one, so the row opens that rather than a
      // read-only list nobody could act on.
      onOpenBankAccounts={() => router.push('/(auth)/verify-identity')}
      onOpenTransactions={() => router.push('/(tabs)/profile/wallets')}
      onOpenSupport={() => router.push('/(tabs)/profile/support')}
      onOpenLegal={() => router.push('/(public)/legal/privacy')}
      onCompleteKyc={() => router.push('/(auth)/verify-identity')}
      onSignOut={() => signOut.mutate()}
    />
  );
}
