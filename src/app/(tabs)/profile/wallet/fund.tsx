import { useQuery } from '@tanstack/react-query';

import { getWalletBalance } from '@/api/endpoints/payments';
import { FundWalletScreen } from '@/features/wallet/fund-wallet-screen';
import { usePayment } from '@/features/payments/use-payment';

export default function FundWalletRoute() {
  const payment = usePayment();
  const wallet = useQuery({ queryKey: ['wallet-balance'], queryFn: getWalletBalance });

  return (
    <FundWalletScreen
      availableMinor={wallet.data?.availableMinor ?? null}
      currency={wallet.data?.currency ?? 'NGN'}
      submitting={false}
      onContinue={(amountMinor) => {
        // Hands off to the shared payment flow rather than charging here: a
        // top-up is confirmed with a method and a PIN like any other payment.
        payment.start({
          target: { kind: 'WALLET_TOPUP', amountMinor },
          title: 'Add money',
          subtitle: 'To your Ajo Cloud wallet',
          returnTo: '/(tabs)/profile/wallets',
        });
      }}
    />
  );
}
