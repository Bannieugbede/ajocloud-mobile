import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  createGroupInvitation,
  getAjoGroup,
  getAjoSchedule,
  lockAjoGroup,
  setAjoGroupListing,
  updateAjoGroupProfile,
} from '@/api/endpoints/ajo-groups';
import { AppActionSheet } from '@/components/ui/app-action-sheet';
import { AppBadge } from '@/components/ui/app-badge';
import { AppBottomSheet } from '@/components/ui/app-bottom-sheet';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppStatTiles } from '@/components/ui/app-stat-tiles';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { groupShareMessage, shareContent } from '@/services/share-links';
import { formatMinorAmount } from '@/utils/money';
import { spacing } from '@/theme';

export default function AjoAdminRoute() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [sheet, setSheet] = useState<'actions' | 'lock' | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const group = useQuery({
    queryKey: ['ajo-group', groupId],
    queryFn: () => getAjoGroup(groupId),
    enabled: Boolean(groupId),
  });
  const schedule = useQuery({
    queryKey: ['ajo-schedule', groupId],
    queryFn: () => getAjoSchedule(groupId),
    enabled: Boolean(groupId),
  });
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ajo-group', groupId] });
    void queryClient.invalidateQueries({ queryKey: ['ajo-schedule', groupId] });
    void queryClient.invalidateQueries({ queryKey: ['ajo-groups'] });
  };
  const lock = useMutation({
    mutationFn: () => lockAjoGroup(groupId),
    onSuccess: () => {
      setSheet(null);
      invalidate();
    },
    meta: { successMessage: 'Rotation locked' },
  });
  const listing = useMutation({
    mutationFn: (listed: boolean) => setAjoGroupListing(groupId, listed),
    onSuccess: () => {
      setSheet(null);
      invalidate();
    },
    meta: { successMessage: 'Group listing updated' },
  });
  const updateProfile = useMutation({
    mutationFn: () =>
      updateAjoGroupProfile(groupId, {
        name: editName.trim(),
        description: editDescription.trim(),
      }),
    onSuccess: () => {
      setEditOpen(false);
      invalidate();
    },
    meta: { successMessage: 'Group details updated' },
  });
  const invite = useMutation({
    mutationFn: async () => {
      if (!group.data) return;
      const code =
        group.data.publiclyListed && group.data.shortCode
          ? group.data.shortCode
          : (await createGroupInvitation(groupId, { maxUses: 1 })).code;
      await shareContent(groupShareMessage(group.data.name, code));
    },
  });

  if (group.isPending) return <AppLoadingState label="Loading Ajo group" />;
  if (!group.data || group.isError)
    return (
      <AppErrorState
        description="Could not load this group."
        onRetry={() => void group.refetch()}
      />
    );

  const rows = schedule.data?.flatMap((cycle) => cycle.contributionSchedules) ?? [];
  const paid = rows.filter((row) => row.status === 'PAID').length;
  const due = rows.length - paid;
  const paidMinor = rows.reduce((sum, row) => sum + BigInt(row.amountPaidMinor), 0n).toString();
  const totalMinor = rows.reduce((sum, row) => sum + BigInt(row.amountDueMinor), 0n).toString();

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <View style={styles.titleRow}>
        <View style={styles.copy}>
          <AppText accessibilityRole="header" weight="bold" style={styles.title}>
            {group.data.name}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            {group.data.members.length} members · {group.data.slots.length}/{group.data.maxSlots}{' '}
            slots
          </AppText>
        </View>
        <AppBadge label={group.data.status.replaceAll('_', ' ')} tone="info" />
      </View>

      <AppStatTiles
        stats={[
          { label: 'Paid', value: String(paid) },
          { label: 'Due', value: String(due) },
          { label: 'Rounds', value: String(schedule.data?.length ?? 0) },
        ]}
      />
      <AppCard>
        <AppText weight="semibold">Contributions collected</AppText>
        <AppText style={{ color: colors.textMuted }}>Across recorded rounds</AppText>
        <AppText weight="bold" style={styles.amount}>
          {formatMinorAmount(paidMinor, group.data.currency)}
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          of {formatMinorAmount(totalMinor, group.data.currency)}
        </AppText>
      </AppCard>

      <AppButton
        label="Group actions"
        icon="options-outline"
        variant="outline"
        onPress={() => setSheet('actions')}
      />
      <AppButton
        label="View group and member rotation"
        icon="people-outline"
        variant="secondary"
        onPress={() => router.push({ pathname: '/(tabs)/ajo/[groupId]', params: { groupId } })}
      />

      {group.data.lockedAt ? (
        <AppCard>
          <AppText weight="semibold">Rotation locked</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Member order and payout dates are fixed.
          </AppText>
        </AppCard>
      ) : null}
      {!schedule.data && schedule.isError ? (
        <AppErrorState
          description="Could not load contribution analytics."
          onRetry={() => void schedule.refetch()}
        />
      ) : null}

      <AppActionSheet
        visible={sheet === 'actions'}
        title="Group actions"
        onClose={() => setSheet(null)}
        actions={[
          ...(['DRAFT', 'OPEN'].includes(group.data.status)
            ? [
                {
                  label: 'Edit group details',
                  description: 'Change the name or description',
                  icon: 'create-outline' as const,
                  onPress: () => {
                    setEditName(group.data!.name);
                    setEditDescription(group.data!.description ?? '');
                    setEditOpen(true);
                  },
                },
              ]
            : []),
          {
            label: 'Share invitation',
            description: 'Create a one person join link',
            icon: 'person-add-outline',
            onPress: () => invite.mutate(),
          },
          {
            label: group.data.publiclyListed ? 'Unlist group' : 'List group',
            description: group.data.publiclyListed
              ? 'Stop public discovery'
              : 'Allow anyone with the link to join',
            icon: 'globe-outline',
            onPress: () => listing.mutate(!group.data.publiclyListed),
          },
          ...(!group.data.lockedAt
            ? [
                {
                  label: 'Lock rotation',
                  description: 'Set the member order and schedule',
                  icon: 'lock-closed-outline' as const,
                  onPress: () => setSheet('lock'),
                },
              ]
            : []),
          {
            label: 'View swap requests',
            description: 'Review member position changes',
            icon: 'swap-horizontal-outline',
            onPress: () =>
              router.push({ pathname: '/(tabs)/ajo/[groupId]/swaps', params: { groupId } }),
          },
        ]}
      />
      <AppActionSheet
        visible={sheet === 'lock'}
        title="Lock this rotation?"
        onClose={() => setSheet(null)}
        actions={[
          {
            label: 'Confirm and lock',
            description: 'This cannot be undone',
            icon: 'lock-closed-outline',
            onPress: () => lock.mutate(),
          },
          { label: 'Keep editing', icon: 'close-outline', onPress: () => setSheet(null) },
        ]}
      />
      <AppBottomSheet
        visible={editOpen}
        title="Edit group details"
        onClose={() => setEditOpen(false)}
      >
        <AppInput
          label="Group name"
          placeholder="e.g. Family savings circle"
          value={editName}
          onChangeText={setEditName}
          icon={<Ionicons name="people-outline" size={19} color={colors.textMuted} />}
        />
        <AppInput
          label="Description"
          placeholder="Add a short group description"
          value={editDescription}
          onChangeText={setEditDescription}
          multiline
          icon={<Ionicons name="document-text-outline" size={19} color={colors.textMuted} />}
        />
        <AppButton
          label="Save changes"
          loading={updateProfile.isPending}
          disabled={editName.trim().length < 3}
          onPress={() => updateProfile.mutate()}
        />
      </AppBottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 21 },
  amount: { fontSize: 26, marginTop: spacing.sm },
});
