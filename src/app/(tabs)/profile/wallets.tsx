import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { getWalletSummary, getWalletTransactions, listWallets } from '@/api/endpoints/wallets';
import { AppText } from '@/components/ui/app-text';
import { formatMinorAmount } from '@/utils/money';

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
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <AppText accessibilityRole="header" weight="bold">
        Wallet and Activity
      </AppText>
      {summary.data ? (
        <View>
          <AppText>Available</AppText>
          <AppText weight="bold">
            {formatMinorAmount(summary.data.availableMinor, summary.data.currency)}
          </AppText>
          <AppText>
            Reserved: {formatMinorAmount(summary.data.reservedMinor, summary.data.currency)}
          </AppText>
        </View>
      ) : (
        <AppText>{wallets.isPending ? 'Loading wallet…' : 'Wallet balance unavailable.'}</AppText>
      )}
      <AppText accessibilityRole="header" weight="semibold">
        Recent activity
      </AppText>
      {history.data?.map((item) => (
        <View key={item.id}>
          <AppText>{item.transaction.description}</AppText>
          <AppText>
            {item.direction === 'CREDIT' ? '+' : '-'}
            {formatMinorAmount(item.amountMinor, item.currency)} · {item.transaction.status}
          </AppText>
        </View>
      ))}
      {history.data?.length === 0 ? <AppText>No wallet activity yet.</AppText> : null}
    </ScrollView>
  );
}
