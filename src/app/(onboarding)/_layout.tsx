import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function OnboardingLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={{ ...stackOptions, headerShown: false }}>
      <Stack.Screen name="introduction" />
    </Stack>
  );
}
