import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { getWalletSummary, getWalletTransactions, listWallets } from '@/api/endpoints/wallets';
import { WalletScreen } from '@/features/wallet/wallet-screen';

export default function WalletsRoute() {
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const wallet = wallets.data?.[0];

  const summary = useQuery({
    queryKey: ['wallet-summary', wallet?.id],
    queryFn: () => getWalletSummary(wallet!.id),
    enabled: Boolean(wallet),
  });
  const history = useQuery({
    queryKey: ['wallet-history', wallet?.id],
    queryFn: () => getWalletTransactions(wallet!.id),
    enabled: Boolean(wallet),
  });

  return (
    <WalletScreen
      summary={summary.data}
      movements={history.data}
      // The wallet has to load before its summary can be asked for, so the
      // screen stays in its loading state across both rather than flashing an
      // empty balance in between.
      loading={wallets.isPending || (Boolean(wallet) && summary.isPending)}
      error={wallets.isError || summary.isError}
      refreshing={summary.isRefetching || history.isRefetching}
      onRefresh={() => {
        void summary.refetch();
        void history.refetch();
      }}
      onRetry={() => {
        void wallets.refetch();
        void summary.refetch();
      }}
      onFund={() => router.push('/(tabs)/profile/wallet/fund')}
      onSend={() => router.push('/(tabs)/profile/wallet/send')}
      onWithdraw={() => router.push('/(tabs)/profile/wallet/withdraw')}
      onOpenHistory={() => router.push('/(tabs)/profile/transactions')}
    />
  );
}
