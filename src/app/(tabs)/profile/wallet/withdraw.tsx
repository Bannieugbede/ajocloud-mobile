import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { listBankAccounts } from '@/api/endpoints/kyc';
import { getWalletSummary, listWallets, requestWithdrawal } from '@/api/endpoints/wallets';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { WithdrawScreen } from '@/features/wallet/withdraw-screen';
import type { AppError } from '@/types/errors';

export default function WithdrawRoute() {
  const queryClient = useQueryClient();
  const [idempotencyKey] = useState(
    () => `wdl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const wallet = wallets.data?.find((candidate) => candidate.status === 'ACTIVE') ?? null;
  const summary = useQuery({
    queryKey: ['wallet-summary', wallet?.id],
    queryFn: () => getWalletSummary(wallet?.id as string),
    enabled: Boolean(wallet?.id),
  });
  const accounts = useQuery({ queryKey: ['bank-accounts'], queryFn: listBankAccounts });

  const withdraw = useMutation({
    mutationFn: (input: { bankAccountId: string; amountMinor: string; transactionPin: string }) => {
      if (!wallet) throw new Error('No wallet is available');
      return requestWithdrawal({ walletId: wallet.id, ...input }, idempotencyKey);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet-summary', wallet?.id] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-movements'] });
      router.replace('/(tabs)/profile/wallets');
    },
  });

  if (wallets.isPending || accounts.isPending) {
    return <AppLoadingState label="Loading your wallet" />;
  }
  if (wallets.isError || !wallet) {
    return (
      <AppErrorState
        description="Could not load your wallet."
        onRetry={() => void wallets.refetch()}
      />
    );
  }

  return (
    <WithdrawScreen
      accounts={accounts.data?.accounts ?? []}
      availableMinor={summary.data?.availableMinor ?? null}
      currency={wallet.currency}
      submitting={withdraw.isPending}
      error={withdraw.error as AppError | null}
      onAddAccount={() => router.push('/(auth)/bank-account')}
      onSubmit={(input) => withdraw.mutate(input)}
    />
  );
}
