import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Share } from 'react-native';

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
import { toast } from '@/components/ui/app-toast';
import { OrganiserPoolScreen } from '@/features/akawo/organiser-pool-screen';
import { poolShareMessage, shareContent } from '@/services/share-links';

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

  // Failures are toasted by the query cache; each success says what changed.

  const lifecycle = useMutation({
    mutationFn: (action: 'open' | 'close' | 'cancel') =>
      action === 'open'
        ? openAkawoPool(poolId)
        : action === 'close'
          ? closeAkawoPool(poolId)
          : cancelAkawoPool(poolId),
    onSuccess: (_pool, action) => {
      toast.success(
        action === 'open'
          ? 'The pool is open. Members can join with its code.'
          : action === 'close'
            ? 'The pool is closed. Its record is final.'
            : 'The pool has been cancelled.',
      );
      invalidate();
    },
  });

  const waive = useMutation({
    mutationFn: (member: AkawoPoolMember) =>
      waivePoolDue(poolId, member.id, 'Waived by the organiser'),
    onSuccess: invalidate,
    meta: { successMessage: 'Their due has been waived.' },
  });

  const listing = useMutation({
    mutationFn: (listed: boolean) => setAkawoPoolListing(poolId, listed),
    onSuccess: (pool) => {
      toast.success(
        pool.publiclyListed
          ? 'Your pool is listed. Anyone can find it and join.'
          : 'Your pool is no longer listed.',
      );
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (member: AkawoPoolMember) => removePoolMember(poolId, member.id),
    onSuccess: invalidate,
    meta: { successMessage: 'The member has been removed.' },
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
          toast.error('The record could not be prepared. Please try again.', {
            title: 'Export failed',
          }),
        );
      }}
      onWaive={(member) => waive.mutate(member)}
      onRemove={(member) => remove.mutate(member)}
    />
  );
}
