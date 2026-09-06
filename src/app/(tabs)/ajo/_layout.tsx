import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function AjoLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* The list draws its own header: it names itself in its first line,
          and a navigator title above that would print "Ajo" twice. */}
      <Stack.Screen name="index" options={{ title: 'Ajo', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Create Ajo Group' }} />
      {/* Reached by replace after creating, so back returns to the list rather
          than the form that has already been submitted. */}
      <Stack.Screen
        name="invitation"
        options={{ title: 'Group created', headerBackVisible: false }}
      />
      <Stack.Screen name="join" options={{ title: 'Join Ajo Group' }} />
      <Stack.Screen name="[groupId]/index" options={{ title: 'Ajo group' }} />
      <Stack.Screen name="[groupId]/contribute" options={{ title: 'Pay contribution' }} />
      <Stack.Screen name="[groupId]/swap" options={{ title: 'Swap positions' }} />
      <Stack.Screen name="[groupId]/swaps" options={{ title: 'Swap requests' }} />
    </Stack>
  );
}
