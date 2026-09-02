import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { getWalletSummary, listWallets, sendToWallet } from '@/api/endpoints/wallets';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { SendMoneyScreen } from '@/features/wallet/send-money-screen';
import type { AppError } from '@/types/errors';

export default function SendMoneyRoute() {
  const queryClient = useQueryClient();
  // One key per mounted flow, so a retried tap reuses the same transfer rather
  // than sending twice. Lazy initialiser: Date.now during render is impure.
  const [idempotencyKey] = useState(
    () => `send-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const wallet = wallets.data?.find((candidate) => candidate.status === 'ACTIVE') ?? null;
  const summary = useQuery({
    queryKey: ['wallet-summary', wallet?.id],
    queryFn: () => getWalletSummary(wallet?.id as string),
    enabled: Boolean(wallet?.id),
  });

  const send = useMutation({
    mutationFn: (input: {
      recipientEmail: string;
      amountMinor: string;
      note?: string;
      transactionPin: string;
    }) => {
      if (!wallet) throw new Error('No wallet is available');
      return sendToWallet({ sourceWalletId: wallet.id, ...input }, idempotencyKey);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet-summary', wallet?.id] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-movements'] });
      // replace: the money has moved, so backing into the form would offer to
      // send again with the details still filled in.
      router.replace('/(tabs)/profile/wallets');
    },
  });

  if (wallets.isPending) return <AppLoadingState label="Loading your wallet" />;
  if (wallets.isError || !wallet) {
    return (
      <AppErrorState
        description="Could not load your wallet."
        onRetry={() => void wallets.refetch()}
      />
    );
  }

  return (
    <SendMoneyScreen
      availableMinor={summary.data?.availableMinor ?? null}
      currency={wallet.currency}
      submitting={send.isPending}
      error={send.error as AppError | null}
      onSubmit={(input) => send.mutate(input)}
    />
  );
}
