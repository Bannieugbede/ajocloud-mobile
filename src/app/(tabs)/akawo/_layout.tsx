import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function AkawoLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Pools are what the tab opens: a collection someone else is running
          has a deadline, where a personal goal does not. Goals keep their own
          route, linked from the pools screen. Draws its own header, so the
          navigator adds none. */}
      <Stack.Screen name="index" options={{ title: 'Akawo', headerShown: false }} />
      <Stack.Screen name="goals" options={{ title: 'Savings goals' }} />
      <Stack.Screen name="create-goal" options={{ title: 'New goal' }} />
      <Stack.Screen name="[goalId]" options={{ title: 'Akawo Goal' }} />
      <Stack.Screen name="pools/create" options={{ title: 'Create Akawo Pool' }} />
      {/* Reached by replace after creating, so its back button returns to the
          pools list rather than the form that has already been submitted. */}
      <Stack.Screen
        name="pools/created"
        options={{ title: 'Pool created', headerBackVisible: false }}
      />
      <Stack.Screen name="pools/join" options={{ title: 'Join Akawo Pool' }} />
      <Stack.Screen name="pools/[poolId]/index" options={{ title: 'Akawo Pool' }} />
      <Stack.Screen name="pools/[poolId]/manage" options={{ title: 'Manage Pool' }} />
    </Stack>
  );
}
