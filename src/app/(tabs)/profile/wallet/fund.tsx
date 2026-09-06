import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { getWalletBalance } from '@/api/endpoints/payments';
import { FundWalletScreen } from '@/features/wallet/fund-wallet-screen';
import { usePaymentStore } from '@/store/payment-store';

export default function FundWalletRoute() {
  const startPayment = usePaymentStore((state) => state.start);
  const wallet = useQuery({ queryKey: ['wallet-balance'], queryFn: getWalletBalance });

  return (
    <FundWalletScreen
      availableMinor={wallet.data?.availableMinor ?? null}
      currency={wallet.data?.currency ?? 'NGN'}
      submitting={false}
      onContinue={(amountMinor) => {
        // Hands off to the shared payment flow rather than charging here: a
        // top-up is confirmed with a method and a PIN like any other payment.
        startPayment({
          target: { kind: 'WALLET_TOPUP', amountMinor },
          title: 'Add money',
          subtitle: 'To your Ajo Cloud wallet',
          returnTo: '/(tabs)/profile/wallets',
        });
        router.push('/(tabs)/pay');
      }}
    />
  );
}
