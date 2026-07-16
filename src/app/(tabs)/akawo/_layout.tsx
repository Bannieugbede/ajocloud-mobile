import { Stack } from 'expo-router';
export default function AkawoLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Akawo' }} />
    </Stack>
  );
}
