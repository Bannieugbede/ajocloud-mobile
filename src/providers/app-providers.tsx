import * as Network from 'expo-network';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type PropsWithChildren } from 'react';

import { toast } from '@/components/ui/app-toast';

import { createQueryCaches } from './query-toasts';

const CONNECTIVITY_TOAST = 'connectivity';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      ...createQueryCaches(() => client),
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 2, refetchOnReconnect: true },
        mutations: { retry: false },
      },
    });
    return client;
  });

  useEffect(() => {
    // Losing the connection is announced once and stays until it returns:
    // money actions must never look available while offline. It is then
    // replaced by a short "back online", never stacked beside it.
    let wasOnline = true;
    const apply = (state: Network.NetworkState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      onlineManager.setOnline(online);
      if (!online && wasOnline) {
        toast.warning('Payments and approvals are unavailable until you reconnect.', {
          id: CONNECTIVITY_TOAST,
          title: 'You’re offline',
          duration: Infinity,
        });
      } else if (online && !wasOnline) {
        toast.success('You’re back online.', { id: CONNECTIVITY_TOAST });
      }
      wasOnline = online;
    };
    const subscription = Network.addNetworkStateListener(apply);
    void Network.getNetworkStateAsync().then(apply);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
