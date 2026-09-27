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
      {/* Home's shortcuts and Quick Pay push straight here from another tab,
          which leaves no history and so no native back button; the declared
          one returns to the bills home when there is nothing to pop. */}
      <Stack.Screen
        name="[categoryId]/index"
        options={{ title: 'Choose a biller', ...backTo('/(tabs)/bills') }}
      />
      <Stack.Screen
        name="[categoryId]/pay"
        options={{ title: 'Pay', ...backTo('/(tabs)/bills') }}
      />
      {/* Reached by replace once the payment exists. Back always replaces with
          the bills home: returning into the flow that produced a receipt is
          exactly what a receipt must prevent. */}
      <Stack.Screen
        name="receipt"
        options={{ title: 'Receipt', ...backTo('/(tabs)/bills', { always: true }) }}
      />
    </Stack>
  );
}
