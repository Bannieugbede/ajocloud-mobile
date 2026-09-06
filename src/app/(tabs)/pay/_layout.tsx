import { Stack } from 'expo-router';

import { backTo } from '@/components/ui/app-header-back';
import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

/**
 * The payment flow, shared by every product.
 *
 * It lives outside any one feature's folder because Akawo, Ajo, Food and bills
 * all hand off to the same three screens. What is being paid for travels in the
 * payment store rather than the URL.
 */
export default function PayLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Entered from a product screen in another navigator, so there is no
          history to go back to. Home is the honest fallback: the screen this
          came from belongs to whichever product started the payment, and the
          payment store knows it only after the flow completes. */}
      <Stack.Screen name="index" options={{ title: 'Payment', ...backTo('/(tabs)/home') }} />
      <Stack.Screen name="[intentId]" options={{ title: 'Confirm payment' }} />
      {/* The result replaces the confirm screen: going back to a PIN prompt for
          a payment that already completed would invite a double payment. */}
      <Stack.Screen name="result" options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack>
  );
}
