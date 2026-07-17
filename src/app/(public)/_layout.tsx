import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function PublicLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="legal/terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="legal/privacy" options={{ title: 'Privacy Policy' }} />
    </Stack>
  );
}
