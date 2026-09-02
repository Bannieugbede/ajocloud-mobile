import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function ProfileLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
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
