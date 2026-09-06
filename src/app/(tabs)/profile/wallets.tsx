import { useQuery } from '@tanstack/react-query';
import { ScrollView, View } from 'react-native';
import { getWalletSummary, getWalletTransactions, listWallets } from '@/api/endpoints/wallets';
import { router } from 'expo-router';
import { AppButton } from '@/components/ui/app-button';
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
        <View style={{ gap: 8 }}>
          <AppText>Available</AppText>
          <AppText weight="bold">
            {formatMinorAmount(summary.data.availableMinor, summary.data.currency)}
          </AppText>
          {/* Shown because a withdrawal moves funds here: without it the
              available balance appears to drop with the money nowhere. */}
          <AppText>
            Reserved: {formatMinorAmount(summary.data.reservedMinor, summary.data.currency)}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* First, because sending and withdrawing both need a funded
                wallet and this is the only way to fund one. */}
            <AppButton
              label="Add money"
              onPress={() => router.push('/(tabs)/profile/wallet/fund')}
            />
            <AppButton
              label="Send"
              variant="outline"
              onPress={() => router.push('/(tabs)/profile/wallet/send')}
            />
            <AppButton
              label="Withdraw"
              variant="outline"
              onPress={() => router.push('/(tabs)/profile/wallet/withdraw')}
            />
          </View>
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
