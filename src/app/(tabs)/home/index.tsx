import { useQueries, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { getAjoGroup, getAjoSchedule, listAjoGroups } from '@/api/endpoints/ajo-groups';
import { listAkawoGoals } from '@/api/endpoints/akawo';
import { listBillPayments } from '@/api/endpoints/bill-payments';
import { getReferralSummary } from '@/api/endpoints/referrals';
import { getCurrentUser } from '@/api/endpoints/users';
import { getWalletSummary, listWallets } from '@/api/endpoints/wallets';
import { HomeScreen } from '@/features/home/home-screen';
import {
  buildUpcoming,
  recentQuickPay,
  totalAkawoSaved,
  type QuickPayItem,
  type UpcomingItem,
} from '@/features/home/home-data';

/** How many groups are inspected for upcoming activity. */
const SCHEDULE_FANOUT = 4;

export default function HomeRoute() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser });
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const groups = useQuery({ queryKey: ['ajo-groups'], queryFn: listAjoGroups });
  const goals = useQuery({ queryKey: ['akawo-goals'], queryFn: listAkawoGoals });
  const referrals = useQuery({ queryKey: ['referral-summary'], queryFn: getReferralSummary });
  const payments = useQuery({ queryKey: ['bill-payments'], queryFn: listBillPayments });

  // The wallet list carries no balance, so the summary is fetched for the
  // first one. A member has a single NGN wallet today; when that stops being
  // true this becomes a sum rather than a lookup.
  const walletId = wallets.data?.[0]?.id;
  const summary = useQuery({
    queryKey: ['wallet-summary', walletId],
    queryFn: () => getWalletSummary(walletId as string),
    enabled: Boolean(walletId),
  });

  // Upcoming activity needs each group's schedule and the viewer's slots in it,
  // neither of which the group list carries. Bounded to the first few groups:
  // the section shows only the soonest handful, and fanning out over every
  // group would cost a request each to render rows nobody sees.
  const scheduledGroups = useMemo(
    () => (groups.data ?? []).slice(0, SCHEDULE_FANOUT),
    [groups.data],
  );

  const details = useQueries({
    queries: scheduledGroups.map((group) => ({
      queryKey: ['ajo-group', group.id],
      queryFn: () => getAjoGroup(group.id),
    })),
  });
  const schedules = useQueries({
    queries: scheduledGroups.map((group) => ({
      queryKey: ['ajo-schedule', group.id],
      queryFn: () => getAjoSchedule(group.id),
    })),
  });

  const viewerUserId = user.data?.id ?? null;

  // `useQueries` returns a fresh array each render, so the results are reduced
  // to a key naming exactly what the calculation reads. Recomputing only when
  // that key changes keeps the memo honest without a dependency array the
  // linter cannot verify.
  const detailData = details.map((query) => query.data);
  const scheduleData = schedules.map((query) => query.data);
  const scheduleKey = [
    viewerUserId ?? '',
    ...detailData.map((detail) => detail?.id ?? ''),
    ...scheduleData.map((cycles) => (cycles ? String(cycles.length) : '')),
    ...scheduleData.flatMap((cycles) =>
      (cycles ?? []).flatMap((cycle) =>
        [...cycle.contributionSchedules, ...cycle.payoutSchedules].map(
          (row) => `${row.id}:${row.status}:${row.amountPaidMinor}`,
        ),
      ),
    ),
  ].join('|');

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const entries = scheduledGroups.flatMap((group, index) => {
      const detail = detailData[index];
      const cycles = scheduleData[index];
      if (!detail || !cycles) return [];
      const mySlotIds = detail.slots
        .filter((slot) => {
          const member = detail.members.find((candidate) => candidate.id === slot.memberId);
          return Boolean(viewerUserId && member?.userId === viewerUserId);
        })
        .map((slot) => slot.id);
      return [{ group, cycles, mySlotIds }];
    });
    return buildUpcoming(entries, new Date());
    // `scheduleKey` stands for the query data the body reads; the arrays
    // themselves change identity on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledGroups, scheduleKey]);

  const quickPay = useMemo(() => recentQuickPay(payments.data), [payments.data]);

  const primary = [user, wallets, groups];
  const refetchAll = () => {
    void Promise.all([
      user.refetch(),
      wallets.refetch(),
      groups.refetch(),
      goals.refetch(),
      referrals.refetch(),
      payments.refetch(),
      summary.refetch(),
    ]);
  };

  const openContribution = (item: UpcomingItem) => {
    router.push({
      pathname: '/(tabs)/ajo/[groupId]/contribute',
      params: { groupId: item.groupId },
    });
  };

  const openQuickPay = (_item: QuickPayItem) => {
    // The pay screen is reached by category and biller; a saved reference
    // cannot be prefilled until a beneficiaries API exists, so this opens the
    // bills home rather than pretending to resume the exact payment.
    router.push('/(tabs)/bills');
  };

  return (
    <HomeScreen
      user={user.data}
      groups={groups.data}
      upcoming={upcoming}
      quickPay={quickPay}
      availableMinor={summary.data?.availableMinor}
      savingsMinor={totalAkawoSaved(goals.data)}
      rewardsMinor={referrals.data?.totalRewardMinor ?? '0'}
      currency={summary.data?.currency ?? 'NGN'}
      loading={primary.some((query) => query.isPending)}
      refreshing={primary.some((query) => query.isRefetching)}
      error={primary.some((query) => query.isError)}
      balanceVisible={balanceVisible}
      onToggleBalance={() => setBalanceVisible((visible) => !visible)}
      onRefresh={refetchAll}
      onRetry={refetchAll}
      onOpenAjo={() => router.navigate('/(tabs)/ajo')}
      onOpenGroup={(groupId) =>
        router.push({ pathname: '/(tabs)/ajo/[groupId]', params: { groupId } })
      }
      onPayContribution={openContribution}
      onOpenBills={() => router.push('/(tabs)/bills')}
      onOpenCategory={() => router.push('/(tabs)/bills')}
      onQuickPay={openQuickPay}
      onSend={() => router.push('/(tabs)/profile/wallet/send')}
      onWithdraw={() => router.push('/(tabs)/profile/wallet/withdraw')}
    />
  );
}
