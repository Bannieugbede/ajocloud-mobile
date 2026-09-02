import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { listAjoGroups } from '@/api/endpoints/ajo-groups';
import { getCurrentUser } from '@/api/endpoints/users';
import { listWallets } from '@/api/endpoints/wallets';
import { HomeScreen } from '@/features/home/home-screen';

export default function HomeRoute() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser });
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const groups = useQuery({ queryKey: ['ajo-groups'], queryFn: listAjoGroups });
  const retry = () => {
    void Promise.all([user.refetch(), wallets.refetch(), groups.refetch()]);
  };
  return (
    <HomeScreen
      user={user.data}
      wallets={wallets.data}
      groups={groups.data}
      loading={user.isPending || wallets.isPending || groups.isPending}
      error={user.isError || wallets.isError || groups.isError}
      balanceVisible={balanceVisible}
      onToggleBalance={() => setBalanceVisible((visible) => !visible)}
      onRetry={retry}
      onOpenAjo={() => router.navigate('/(tabs)/ajo')}
      onPayBill={() => router.push('/(tabs)/bills')}
      onOpenAkawo={() => router.navigate('/(tabs)/akawo')}
    />
  );
}
