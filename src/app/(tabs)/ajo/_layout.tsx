import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function AjoLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Ajo' }} />
      <Stack.Screen name="create" options={{ title: 'New Ajo group' }} />
      {/* Reached by replace after creating, so back returns to the list rather
          than the form that has already been submitted. */}
      <Stack.Screen
        name="invitation"
        options={{ title: 'Group created', headerBackVisible: false }}
      />
      <Stack.Screen name="join" options={{ title: 'Join a group' }} />
      <Stack.Screen name="[groupId]/index" options={{ title: 'Ajo group' }} />
      <Stack.Screen name="[groupId]/swap" options={{ title: 'Swap positions' }} />
      <Stack.Screen name="[groupId]/swaps" options={{ title: 'Swap requests' }} />
    </Stack>
  );
}
