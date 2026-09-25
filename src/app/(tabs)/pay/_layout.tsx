import { Stack } from 'expo-router';

import { backTo } from '@/components/ui/app-header-back';
import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';

/**
 * The payment flow, shared by every product.
 *
 * It lives outside any one feature's folder because Akawo, Ajo, Food and wallet
 * top-ups all hand off to the same three screens, through `usePayment`. What is
 * being paid for travels in the payment store rather than the URL.
 */
export default function PayLayout() {
  const stackOptions = useThemedStackOptions();

  return (
    <Stack screenOptions={stackOptions}>
      {/* Entered from a product screen in another navigator, so there is no
          history to go back to. The route points back at the product that
          started the payment; Home is only the default before it has read the
          request. */}
      <Stack.Screen name="index" options={{ title: 'Payment', ...backTo('/(tabs)/home') }} />
      <Stack.Screen name="[intentId]" options={{ title: 'Confirm payment' }} />
      {/* The result replaces the confirm screen: going back to a PIN prompt for
          a payment that already completed would invite a double payment. */}
      <Stack.Screen name="result" options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack>
  );
}
