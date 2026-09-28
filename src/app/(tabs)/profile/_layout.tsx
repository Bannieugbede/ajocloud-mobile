import { Stack } from 'expo-router';

import { backTo } from '@/components/ui/app-header-back';
import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function ProfileLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Draws its own header; see the note in the Ajo layout. */}
      <Stack.Screen name="index" options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="fees" options={{ title: 'Platform Fees' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="referrals" options={{ title: 'Referrals' }} />
      <Stack.Screen name="support" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="transactions" options={{ title: 'Transaction History' }} />
      <Stack.Screen name="wallets" options={{ title: 'My Wallet' }} />
      <Stack.Screen name="wallet/fund" options={{ title: 'Fund Wallet' }} />
      <Stack.Screen name="wallet/send" options={{ title: 'Send Money' }} />
      {/* Reached by replace after sending, so back returns to the wallet
          rather than the form that has already been submitted. */}
      <Stack.Screen
        name="wallet/send-success"
        options={{ title: 'Money Sent', headerBackVisible: false }}
      />
      {/* Also pushed from the Home tab, which leaves no stack history for a
          native back button, so it carries its own that falls back here. */}
      <Stack.Screen
        name="wallet/withdraw"
        options={{ title: 'Withdraw', ...backTo('/(tabs)/profile/wallets') }}
      />
    </Stack>
  );
}
