import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

import {
  getFoodProgramme,
  listMySubscriptions,
  subscribeToProgramme,
  unsubscribeFromProgramme,
} from '@/api/endpoints/food-ajo';
import type { FoodSubscription } from '@/api/endpoints/food-ajo';
import { FoodDetailScreen } from '@/features/food/food-detail-screen';
import { enrolmentPayment } from '@/features/food/programme-summary';
import { usePayment } from '@/features/payments/use-payment';
import { toast } from '@/components/ui/app-toast';
import { foodShareMessage, shareContent } from '@/services/share-links';
import type { AppError } from '@/types/errors';
import { useKycCheck } from '@/features/kyc/kyc-gate';

export default function FoodProgrammeRoute() {
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const queryClient = useQueryClient();
  const payment = usePayment();

  const programme = useQuery({
    queryKey: ['food-programme', programmeId],
    queryFn: () => getFoodProgramme(programmeId),
    enabled: Boolean(programmeId),
  });

  // Enrolment lives on the member's own list rather than the programme, so
  // both are needed before the screen can say whether they have joined.
  const subscriptions = useQuery({
    queryKey: ['food-subscriptions'],
    queryFn: listMySubscriptions,
  });
  const subscription = subscriptions.data?.find((entry) => entry.groupId === programmeId) ?? null;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['food-programme', programmeId] });
    void queryClient.invalidateQueries({ queryKey: ['food-subscriptions'] });
    void queryClient.invalidateQueries({ queryKey: ['food-programmes'] });
  };

  const pay = (enrolment: FoodSubscription) =>
    payment.start({
      target: { kind: 'FOOD_SUBSCRIPTION', programmeId, subscriptionId: enrolment.id },
      title: programme.data?.name ?? enrolment.group.name,
      subtitle: enrolment.package.name,
      returnTo: `/(tabs)/food/${programmeId}`,
    });

  const kyc = useKycCheck();
  const subscribe = useMutation({
    mutationFn: (packageId: string) => subscribeToProgramme(programmeId, { packageId }),
    onSuccess: (enrolment) => {
      refresh();
      // Enrolling holds a place; paying confirms it. Straight on to payment,
      // so joining is one flow rather than two visits. Leaving it unpaid is
      // still possible, and the Pay button stays here until it is paid.
      pay(enrolment);
    },
  });
  const unsubscribe = useMutation({
    mutationFn: () => unsubscribeFromProgramme(programmeId),
    onSuccess: () => {
      refresh();
      // A paid enrolment was refunded, so the wallet has moved too.
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['wallets'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-summary'] });
      toast.success(
        subscription && subscription.amountPaidMinor && subscription.amountPaidMinor !== '0'
          ? 'You’ve left this programme. What you paid is back in your wallet.'
          : 'You’ve left this programme.',
      );
    },
  });
  const owed = programme.data ? enrolmentPayment(subscription, programme.data.status) : null;

  // Only a programme others can see is worth sharing: the website's page for
  // it answers for OPEN and ACTIVE programmes alone.
  const shareable =
    programme.data && (programme.data.status === 'OPEN' || programme.data.status === 'ACTIVE')
      ? foodShareMessage(programme.data.name, programme.data.shortCode)
      : null;

  return (
    <FoodDetailScreen
      {...(programme.data ? { programme: programme.data } : {})}
      subscription={subscription}
      loading={programme.isPending}
      error={programme.isError}
      refreshing={programme.isRefetching || subscriptions.isRefetching}
      submitting={subscribe.isPending || unsubscribe.isPending}
      actionError={(subscribe.error ?? unsubscribe.error) as AppError | null}
      onRefresh={() => {
        void programme.refetch();
        void subscriptions.refetch();
      }}
      onRetry={() => void programme.refetch()}
      onSubscribe={(packageId) => {
        if (kyc.ensure('food.subscribe')) subscribe.mutate(packageId);
      }}
      onUnsubscribe={() => unsubscribe.mutate()}
      {...(owed?.payable && subscription ? { onPay: () => pay(subscription) } : {})}
      {...(shareable ? { onShare: () => void shareContent(shareable) } : {})}
    />
  );
}
