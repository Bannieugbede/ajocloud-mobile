import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { payAjoContribution } from '@/api/endpoints/ajo-groups';
import { PayContributionScreen } from '@/features/ajo/pay-contribution-screen';
import type { AppError } from '@/types/errors';

export default function PayContributionRoute() {
  const params = useLocalSearchParams<{
    groupId: string;
    scheduleId: string;
    groupName?: string;
    sequence?: string;
    amountDueMinor?: string;
    amountPaidMinor?: string;
    currency?: string;
  }>();
  const queryClient = useQueryClient();

  /**
   * Generated once per visit to this screen rather than per tap.
   *
   * A retry after a timeout must settle the same contribution rather than a
   * second one, and the server scopes this to the schedule — so the same key
   * cannot leak into a different round.
   *
   * Filled in an effect rather than during render: the clock and the random
   * source are both impure, and a render that React replays would otherwise
   * produce a different key each time.
   */
  const idempotencyKey = useRef<string | null>(null);
  useEffect(() => {
    idempotencyKey.current ??= `${params.scheduleId}-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    ).toString(36)}`;
  }, [params.scheduleId]);

  const pay = useMutation({
    mutationFn: (amountMinor: string) =>
      payAjoContribution(params.groupId, params.scheduleId, {
        amountMinor,
        // The effect has run by the time anything can be pressed.
        idempotencyKey: idempotencyKey.current ?? `${params.scheduleId}-${Date.now()}`,
      }),
    onSuccess: () => {
      // The schedule, the group and the wallet have all moved.
      void queryClient.invalidateQueries({ queryKey: ['ajo-schedule', params.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['ajo-group', params.groupId] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      // back rather than replace: the group screen is already underneath, and
      // returning to it shows the contribution now settled.
      router.back();
    },
  });

  return (
    <PayContributionScreen
      groupName={params.groupName ?? 'Your group'}
      sequence={Number(params.sequence ?? '1')}
      amountDueMinor={params.amountDueMinor ?? '0'}
      amountPaidMinor={params.amountPaidMinor ?? '0'}
      currency={params.currency ?? 'NGN'}
      submitting={pay.isPending}
      error={pay.error as AppError | null}
      onSubmit={(amountMinor) => pay.mutate(amountMinor)}
    />
  );
}
