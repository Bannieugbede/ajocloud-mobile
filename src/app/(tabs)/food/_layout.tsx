import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function FoodLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Draws its own header; see the note in the Ajo layout. */}
      <Stack.Screen name="index" options={{ title: 'Food', headerShown: false }} />
      {/* The photographic header carries the title and runs under the status
          bar, so a navigator header on top of it would draw the name twice.
          The screen supplies its own back control. */}
      <Stack.Screen name="[programmeId]" options={{ title: 'Food Ajo', headerShown: false }} />
      <Stack.Screen name="apply" options={{ title: 'Become a Coordinator' }} />
    </Stack>
  );
}
