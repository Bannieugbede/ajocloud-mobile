import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  createFoodDistribution,
  getFoodProcurementPlan,
  getFoodProgramme,
  listFoodDistributions,
  transitionFoodProgramme,
  updateFoodPackage,
  type FoodPackage,
  type FoodProgramme,
} from '@/api/endpoints/food-ajo';
import { AppActionSheet } from '@/components/ui/app-action-sheet';
import { AppBadge } from '@/components/ui/app-badge';
import { AppBottomSheet } from '@/components/ui/app-bottom-sheet';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppStatTiles } from '@/components/ui/app-stat-tiles';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { toast } from '@/components/ui/app-toast';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { foodShareMessage, shareContent } from '@/services/share-links';

export default function FoodAdminRoute() {
  const { programmeId } = useLocalSearchParams<{ programmeId: string }>();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState<FoodPackage | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const programme = useQuery({
    queryKey: ['food-programme', programmeId],
    queryFn: () => getFoodProgramme(programmeId),
    enabled: Boolean(programmeId),
  });
  const plan = useQuery({
    queryKey: ['food-procurement-plan', programmeId],
    queryFn: () => getFoodProcurementPlan(programmeId),
    enabled: Boolean(programmeId),
  });
  const distributions = useQuery({
    queryKey: ['food-distributions', programmeId],
    queryFn: () => listFoodDistributions(programmeId),
    enabled: Boolean(programmeId),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['food-programmes', 'COORDINATED'] });
    void queryClient.invalidateQueries({ queryKey: ['food-programme', programmeId] });
    void queryClient.invalidateQueries({ queryKey: ['food-procurement-plan', programmeId] });
    void queryClient.invalidateQueries({ queryKey: ['food-distributions', programmeId] });
  };
  const transition = useMutation({
    mutationFn: (status: string) => transitionFoodProgramme(programmeId, status),
    onSuccess: () => {
      setMenuOpen(false);
      setPendingStatus(null);
      refresh();
    },
    meta: { successMessage: 'Programme status updated' },
  });
  const share = useMutation({
    mutationFn: async (programmeData: FoodProgramme) => {
      const message = foodShareMessage(programmeData.name, programmeData.shortCode);
      if (!message) throw new Error('The programme link is unavailable');
      await shareContent(message);
    },
  });
  const edit = useMutation({
    mutationFn: () =>
      updateFoodPackage(programmeId, editing!.id, { name: editName.trim(), priceMinor: editPrice }),
    onSuccess: () => {
      setEditing(null);
      refresh();
      toast.success('Package updated');
    },
  });
  const planDistribution = useMutation({
    mutationFn: () => {
      const date = new Date(scheduledAt);
      if (Number.isNaN(date.getTime())) throw new Error('Enter a valid ISO date and time');
      return createFoodDistribution(programmeId, date.toISOString());
    },
    onSuccess: () => {
      setDistributionOpen(false);
      refresh();
      toast.success('Distribution planned');
    },
  });

  if (programme.isPending) return <AppLoadingState label="Loading food group" />;
  if (!programme.data || programme.isError)
    return (
      <AppErrorState
        description="Could not load this food group."
        onRetry={() => void programme.refetch()}
      />
    );
  const data = programme.data;
  const transitions: Record<string, string[]> = {
    DRAFT: ['OPEN', 'CANCELLED'],
    OPEN: ['ACTIVE', 'SUSPENDED', 'CANCELLED'],
    ACTIVE: ['SUSPENDED', 'COMPLETED'],
    SUSPENDED: ['OPEN', 'ACTIVE', 'CANCELLED'],
  };
  const available = transitions[data.status] ?? [];

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" weight="bold" style={styles.title}>
            {data.name}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            {data.packages.length} packages · capacity {data.enrolmentCapacity}
          </AppText>
        </View>
        <AppBadge label={data.status.replaceAll('_', ' ')} tone="info" />
      </View>
      <AppStatTiles
        stats={[
          { label: 'Enrolled', value: String(data._count.subscriptions) },
          { label: 'Portions', value: String(plan.data?.totalPortions ?? '—') },
          { label: 'Distributions', value: String(distributions.data?.length ?? '—') },
        ]}
      />
      {plan.data ? (
        <AppCard>
          <AppText weight="semibold">Collected for food</AppText>
          <AppText weight="bold" style={styles.amount}>
            {formatMinorAmount(plan.data.collectedMinor, data.currency)}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            Expected {formatMinorAmount(plan.data.expectedMinor, data.currency)}
          </AppText>
          {plan.data.packages.map((item) => (
            <View
              key={item.packageId}
              style={[styles.packageRow, { borderTopColor: colors.border }]}
            >
              <View style={styles.copy}>
                <AppText weight="medium">{item.name}</AppText>
                <AppText style={{ color: colors.textMuted }}>
                  {item.portions} portions · {item.subscribers} enrolments
                </AppText>
              </View>
              <AppText weight="semibold">
                {formatMinorAmount(item.collectedMinor, data.currency)}
              </AppText>
            </View>
          ))}
        </AppCard>
      ) : plan.isError ? (
        <AppErrorState
          description="Could not load the procurement summary."
          onRetry={() => void plan.refetch()}
        />
      ) : (
        <AppLoadingState label="Loading procurement summary" />
      )}
      <AppCard>
        <AppText weight="semibold">Packages</AppText>
        {data.packages.map((item) => (
          <View key={item.id} style={[styles.packageRow, { borderTopColor: colors.border }]}>
            <View style={styles.copy}>
              <AppText weight="medium">{item.name}</AppText>
              <AppText style={{ color: colors.textMuted }}>
                {formatMinorAmount(item.priceMinor, item.currency)}
                {item.priceLockedAt ? ' · Price locked' : ''}
              </AppText>
            </View>
            {item.priceLockedAt ? null : (
              <AppButton
                label={`Edit ${item.name}`}
                size="compact"
                variant="outline"
                icon="create-outline"
                onPress={() => {
                  setEditing(item);
                  setEditName(item.name);
                  setEditPrice(item.priceMinor);
                }}
              />
            )}
          </View>
        ))}
      </AppCard>
      <AppCard>
        <AppText weight="semibold">Distribution schedule</AppText>
        {(distributions.data ?? []).map((distribution) => (
          <View key={distribution.id} style={styles.packageRow}>
            <AppText>{new Date(distribution.scheduledAt).toLocaleDateString()}</AppText>
            <AppBadge label={distribution.status.replaceAll('_', ' ')} tone="info" />
          </View>
        ))}
        <AppButton
          label="Plan distribution"
          icon="calendar-outline"
          variant="outline"
          onPress={() => setDistributionOpen(true)}
        />
      </AppCard>
      <AppButton
        label="Programme actions"
        icon="options-outline"
        onPress={() => setMenuOpen(true)}
      />

      <AppActionSheet
        visible={menuOpen}
        title="Programme actions"
        onClose={() => setMenuOpen(false)}
        actions={[
          ...(['OPEN', 'ACTIVE'].includes(data.status)
            ? [
                {
                  label: 'Share food group',
                  description: 'Send the public programme link',
                  icon: 'share-outline' as const,
                  onPress: () => share.mutate(data),
                },
              ]
            : []),
          ...available.map((status) => ({
            label: status === 'OPEN' ? 'Open enrolment' : status.replaceAll('_', ' '),
            description:
              status === 'OPEN' ? 'Locks package prices and accepts enrolment' : undefined,
            icon:
              status === 'CANCELLED'
                ? ('close-circle-outline' as const)
                : status === 'ACTIVE'
                  ? ('cart-outline' as const)
                  : ('swap-horizontal-outline' as const),
            onPress: () => setPendingStatus(status),
          })),
        ]}
      />
      <AppBottomSheet
        visible={pendingStatus !== null}
        title="Confirm programme status"
        onClose={() => setPendingStatus(null)}
      >
        <AppText>
          Move this programme to {pendingStatus?.replaceAll('_', ' ').toLowerCase()}?
        </AppText>
        <AppButton
          label="Confirm status change"
          variant={pendingStatus === 'CANCELLED' ? 'danger' : 'primary'}
          loading={transition.isPending}
          onPress={() => {
            if (pendingStatus) transition.mutate(pendingStatus);
          }}
        />
      </AppBottomSheet>
      <AppBottomSheet
        visible={Boolean(editing)}
        title="Edit package"
        onClose={() => setEditing(null)}
      >
        <AppInput
          label="Package name"
          placeholder="e.g. Family basket"
          value={editName}
          onChangeText={setEditName}
          icon={<Ionicons name="basket-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Price (kobo)"
          placeholder="e.g. 1500000"
          keyboardType="number-pad"
          value={editPrice}
          onChangeText={setEditPrice}
          icon={<Ionicons name="pricetag-outline" size={19} color={colors.textMuted} />}
        />
        <AppButton
          label="Save package"
          loading={edit.isPending}
          disabled={!editName.trim() || !/^\d+$/.test(editPrice) || Number(editPrice) <= 0}
          onPress={() => edit.mutate()}
        />
      </AppBottomSheet>
      <AppBottomSheet
        visible={distributionOpen}
        title="Plan distribution"
        onClose={() => setDistributionOpen(false)}
      >
        <AppInput
          label="Scheduled date and time (ISO)"
          placeholder="2026-11-30T09:00:00.000Z"
          value={scheduledAt}
          onChangeText={setScheduledAt}
          icon={<Ionicons name="calendar-outline" size={19} color={colors.textMuted} />}
        />
        <AppButton
          label="Save distribution"
          loading={planDistribution.isPending}
          disabled={Number.isNaN(new Date(scheduledAt).getTime())}
          onPress={() => planDistribution.mutate()}
        />
      </AppBottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 21 },
  amount: { fontSize: 26, marginTop: spacing.sm },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
});
