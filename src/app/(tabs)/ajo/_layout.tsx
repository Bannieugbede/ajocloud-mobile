import { Stack } from 'expo-router';
export default function AjoLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ajo' }} />
    </Stack>
  );
}
