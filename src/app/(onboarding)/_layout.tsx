import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="introduction" options={{ title: 'About Ajo Cloud' }} />
    </Stack>
  );
}
