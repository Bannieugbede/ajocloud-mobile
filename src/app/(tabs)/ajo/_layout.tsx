import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function AjoLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Ajo' }} />
      <Stack.Screen name="[groupId]" options={{ title: 'Ajo Group' }} />
    </Stack>
  );
}
