import { router, useLocalSearchParams } from 'expo-router';

import { SendSuccessScreen } from '@/features/wallet/send-success-screen';

export default function SendSuccessRoute() {
  const { recipientEmail, amountMinor, currency, reference } = useLocalSearchParams<{
    recipientEmail: string;
    amountMinor: string;
    currency: string;
    reference?: string;
  }>();

  return (
    <SendSuccessScreen
      recipientEmail={recipientEmail}
      amountMinor={amountMinor}
      currency={currency ?? 'NGN'}
      {...(reference ? { reference } : {})}
      // replace: the transfer settled, and backing into the form would offer
      // to send the same money a second time.
      onDone={() => router.replace('/(tabs)/profile/wallets')}
    />
  );
}
