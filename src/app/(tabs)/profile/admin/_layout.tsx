import { Stack } from 'expo-router';

import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function GroupAdminLayout() {
  const options = useThemedStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ title: 'Group management' }} />
      <Stack.Screen name="ajo/[groupId]" options={{ title: 'Ajo management' }} />
      <Stack.Screen name="food/[programmeId]" options={{ title: 'Food group management' }} />
      <Stack.Screen name="food/create" options={{ title: 'Create food group' }} />
    </Stack>
  );
}
