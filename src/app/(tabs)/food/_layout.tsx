import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function FoodLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="index" options={{ title: 'Food' }} />
      <Stack.Screen name="[programmeId]" options={{ title: 'Food Ajo' }} />
    </Stack>
  );
}
