import { useQuery } from '@tanstack/react-query';

import { getWalletTransactions, listWallets } from '@/api/endpoints/wallets';
import { TransactionHistoryScreen } from '@/features/wallet/transaction-history-screen';

export default function TransactionHistoryRoute() {
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const wallet = wallets.data?.[0];

  const history = useQuery({
    queryKey: ['wallet-history', wallet?.id],
    queryFn: () => getWalletTransactions(wallet!.id),
    enabled: Boolean(wallet),
  });

  return (
    <TransactionHistoryScreen
      movements={history.data}
      currency={wallet?.currency ?? 'NGN'}
      // The wallet has to load before its history can be asked for, so the
      // screen stays in its loading state across both rather than flashing an
      // empty history in between.
      loading={wallets.isPending || (Boolean(wallet) && history.isPending)}
      error={wallets.isError || history.isError}
      refreshing={history.isRefetching}
      onRefresh={() => void history.refetch()}
      onRetry={() => {
        void wallets.refetch();
        void history.refetch();
      }}
    />
  );
}
