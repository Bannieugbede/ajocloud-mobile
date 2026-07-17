import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function AkawoLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Akawo' }} />
      <Stack.Screen name="[goalId]" options={{ title: 'Akawo Goal' }} />
    </Stack>
  );
}
