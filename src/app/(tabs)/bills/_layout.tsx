import { Stack } from 'expo-router';

import { backTo } from '@/components/ui/app-header-back';
import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

export default function BillsLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Reached from Home rather than from a tab, which switches navigator and
          leaves no history, so back is declared. */}
      <Stack.Screen
        name="index"
        options={{ title: 'Bills & Payments', ...backTo('/(tabs)/home') }}
      />
      <Stack.Screen name="[categoryId]/index" options={{ title: 'Choose a biller' }} />
      <Stack.Screen name="[categoryId]/pay" options={{ title: 'Pay' }} />
      {/* Reached by replace once the payment exists: going back to a form that
          would charge again is exactly what a receipt must prevent. */}
      <Stack.Screen name="receipt" options={{ title: 'Receipt', headerBackVisible: false }} />
    </Stack>
  );
}
