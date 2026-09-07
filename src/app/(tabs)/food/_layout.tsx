import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function FoodLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Draws its own header; see the note in the Ajo layout. */}
      <Stack.Screen name="index" options={{ title: 'Food', headerShown: false }} />
      <Stack.Screen name="[programmeId]" options={{ title: 'Food Ajo' }} />
      <Stack.Screen name="apply" options={{ title: 'Become a Coordinator' }} />
    </Stack>
  );
}
