import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function HomeLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Home draws its own header: the greeting, the member's name, and the
          appearance and notification controls sit inside the scroll view so
          they scroll away with the content rather than pinning a title bar
          above a screen that already names itself. */}
      <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
    </Stack>
  );
}
