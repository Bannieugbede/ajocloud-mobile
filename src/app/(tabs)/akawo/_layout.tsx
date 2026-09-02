import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function AkawoLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Akawo' }} />
      <Stack.Screen name="[goalId]" options={{ title: 'Akawo Goal' }} />
      <Stack.Screen name="pools/index" options={{ title: 'Pools' }} />
      <Stack.Screen name="pools/create" options={{ title: 'New pool' }} />
      {/* Reached by replace after creating, so its back button returns to the
          pools list rather than the form that has already been submitted. */}
      <Stack.Screen
        name="pools/created"
        options={{ title: 'Pool created', headerBackVisible: false }}
      />
      <Stack.Screen name="pools/join" options={{ title: 'Join a pool' }} />
      <Stack.Screen name="pools/[poolId]/index" options={{ title: 'Pool' }} />
      <Stack.Screen name="pools/[poolId]/manage" options={{ title: 'Manage pool' }} />
    </Stack>
  );
}
