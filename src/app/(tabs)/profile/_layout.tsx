import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function ProfileLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Draws its own header; see the note in the Ajo layout. */}
      <Stack.Screen name="index" options={{ title: 'Profile', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="fees" options={{ title: 'Platform fees' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="support" options={{ title: 'Get help' }} />
      <Stack.Screen name="wallets" options={{ title: 'Wallets' }} />
      <Stack.Screen name="wallet/send" options={{ title: 'Send money' }} />
      <Stack.Screen name="wallet/withdraw" options={{ title: 'Withdraw' }} />
    </Stack>
  );
}
