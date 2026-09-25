import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Share } from 'react-native';

import {
  cancelAkawoPool,
  closeAkawoPool,
  getOrganiserPool,
  openAkawoPool,
  removePoolMember,
  setAkawoPoolListing,
  waivePoolDue,
  type AkawoPoolMember,
} from '@/api/endpoints/akawo-pools';
import { exportPoolRecord } from '@/features/akawo/export-pool-record';
import { OrganiserPoolScreen } from '@/features/akawo/organiser-pool-screen';
import { poolShareMessage, shareContent } from '@/services/share-links';
import type { AppError } from '@/types/errors';

export default function ManagePoolRoute() {
  const { poolId } = useLocalSearchParams<{ poolId: string }>();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['akawo-pool', 'organiser', poolId],
    queryFn: () => getOrganiserPool(poolId),
    enabled: Boolean(poolId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['akawo-pool', 'organiser', poolId] });
    void queryClient.invalidateQueries({ queryKey: ['akawo-pools'] });
  };

  const report = (error: unknown) => {
    const message =
      (error as AppError | null)?.message ?? 'That could not be completed. Please try again.';
    Alert.alert('Not completed', message);
  };

  const lifecycle = useMutation({
    mutationFn: (action: 'open' | 'close' | 'cancel') =>
      action === 'open'
        ? openAkawoPool(poolId)
        : action === 'close'
          ? closeAkawoPool(poolId)
          : cancelAkawoPool(poolId),
    onSuccess: invalidate,
    onError: report,
  });

  const waive = useMutation({
    mutationFn: (member: AkawoPoolMember) =>
      waivePoolDue(poolId, member.id, 'Waived by the organiser'),
    onSuccess: invalidate,
    onError: report,
  });

  const listing = useMutation({
    mutationFn: (listed: boolean) => setAkawoPoolListing(poolId, listed),
    onSuccess: invalidate,
    onError: report,
  });

  const remove = useMutation({
    mutationFn: (member: AkawoPoolMember) => removePoolMember(poolId, member.id),
    onSuccess: invalidate,
    onError: report,
  });

  return (
    <OrganiserPoolScreen
      data={query.data}
      loading={query.isPending}
      error={query.isError}
      refreshing={query.isRefetching}
      busy={lifecycle.isPending || waive.isPending || remove.isPending}
      onRefresh={() => void query.refetch()}
      onRetry={() => void query.refetch()}
      onOpen={() => lifecycle.mutate('open')}
      onClose={() => lifecycle.mutate('close')}
      onCancel={() => lifecycle.mutate('cancel')}
      onShareCode={() => {
        const pool = query.data;
        // A listed pool has a permanent link that admits anyone, so it can be
        // shared again at any time. Otherwise the plaintext join code is never
        // returned after creation, so this shares the pool by name and leaves
        // the code to the organiser's own copy of it.
        if (pool?.publiclyListed && pool.shortCode) {
          void shareContent(poolShareMessage(pool.name, pool.shortCode, { typeable: false }));
          return;
        }
        void Share.share({
          message: `Join "${pool?.name ?? 'my pool'}" on Ajo Cloud with the code I sent you.`,
        });
      }}
      listing={listing.isPending}
      onSetListing={(listed) => listing.mutate(listed)}
      onExport={() => {
        if (!query.data) return;
        void exportPoolRecord(query.data).catch(() =>
          Alert.alert('Export failed', 'The record could not be prepared. Please try again.'),
        );
      }}
      onWaive={(member) => waive.mutate(member)}
      onRemove={(member) => remove.mutate(member)}
    />
  );
}
