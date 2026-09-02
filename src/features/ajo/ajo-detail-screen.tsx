import { ScrollView, StyleSheet, View } from 'react-native';

import type { AjoCycle, AjoGroupDetail } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';
import {
  buildRotation,
  canLock,
  canRequestSwap,
  lockBlockedReason,
  outstandingContributions,
} from './rotation';

export function AjoDetailScreen({
  group,
  cycles,
  viewerUserId,
  loading,
  error,
  locking,
  onRetry,
  onLock,
  onRequestSwap,
  onPayContribution,
}: {
  group?: AjoGroupDetail;
  cycles?: AjoCycle[];
  viewerUserId: string | null;
  loading: boolean;
  error: boolean;
  locking?: boolean;
  onRetry: () => void;
  onLock: () => void;
  onRequestSwap: () => void;
  onPayContribution: (input: { slotId: string; amountMinor: string; sequence: number }) => void;
}) {
  const { colors } = useTheme();

  if (loading) return <AppLoadingState label="Loading this Ajo group" />;
  if (error || !group) {
    return <AppErrorState description="Could not load this Ajo group." onRetry={onRetry} />;
  }

  const rotation = buildRotation(cycles ?? [], group, viewerUserId);
  const outstanding = outstandingContributions(cycles ?? [], group, viewerUserId);
  const nextDue = outstanding[0];
  const lockBlocked = lockBlockedReason(group);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <AppText style={{ color: colors.textInverse }}>Contribution each round</AppText>
        <AppText weight="bold" style={[styles.amount, { color: colors.textInverse }]}>
          {formatMinorAmount(group.baseContributionMinor, group.currency)}
        </AppText>
        <AppText style={{ color: colors.textInverse }}>
          {statusLabel(group.contributionFrequency)} · {statusLabel(group.status)}
        </AppText>
      </View>

      <View style={styles.stats}>
        {[
          ['Members', group.members.length],
          ['Positions', group.slots.length],
          ['Capacity', group.maxSlots],
        ].map(([label, value]) => (
          <View
            key={String(label)}
            style={[
              styles.stat,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <AppText weight="bold">{value}</AppText>
            <AppText style={{ color: colors.textMuted }}>{label}</AppText>
          </View>
        ))}
      </View>

      {nextDue ? (
        <AppCard>
          <AppText weight="semibold">Your next contribution</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Round {nextDue.sequence} · due {nextDue.dueAt.slice(0, 10)}
          </AppText>
          <AppText weight="bold" style={styles.due}>
            {formatMinorAmount(nextDue.amountMinor, nextDue.currency)}
          </AppText>
          <AppButton
            label="Pay contribution"
            onPress={() =>
              onPayContribution({
                slotId: nextDue.slotId,
                amountMinor: nextDue.amountMinor,
                sequence: nextDue.sequence,
              })
            }
          />
        </AppCard>
      ) : null}

      {canLock(group, viewerUserId) ? (
        <AppCard>
          <AppText weight="semibold">This rotation has not started</AppText>
          {/* The reason is shown instead of the button, so an administrator is
              told to invite people rather than tapping into a 422. */}
          <AppText style={{ color: colors.textMuted }}>
            {lockBlocked ??
              'Locking works out the order and the dates. It cannot be undone, so add everyone first.'}
          </AppText>
          {lockBlocked ? null : (
            <AppButton
              label="Lock the rotation"
              onPress={onLock}
              loading={locking ?? false}
              disabled={locking ?? false}
            />
          )}
        </AppCard>
      ) : null}

      <AppText accessibilityRole="header" weight="semibold">
        Rotation
      </AppText>
      {rotation.length === 0 ? (
        <AppText style={{ color: colors.textMuted }}>
          The order is set when the group is locked.
        </AppText>
      ) : (
        rotation.map((entry) => (
          <View key={`${entry.sequence}-${entry.slotId}`} style={styles.row}>
            <View
              style={[
                styles.position,
                { backgroundColor: entry.isMine ? colors.primary : colors.surfaceMuted },
              ]}
            >
              <AppText
                weight="bold"
                style={{ color: entry.isMine ? colors.textInverse : colors.text }}
              >
                {entry.sequence}
              </AppText>
            </View>
            <View style={styles.rowBody}>
              <AppText weight={entry.isMine ? 'semibold' : 'regular'}>
                {entry.isMine ? `${entry.holderName} (you)` : entry.holderName}
              </AppText>
              <AppText style={{ color: colors.textMuted }}>
                {entry.payoutDueAt.slice(0, 10)} · {statusLabel(entry.status)}
              </AppText>
            </View>
            <AppText weight="semibold">
              {formatMinorAmount(entry.amountDueMinor, entry.currency)}
            </AppText>
          </View>
        ))
      )}

      {canRequestSwap(group) ? (
        <AppButton label="Ask to swap positions" variant="outline" onPress={onRequestSwap} />
      ) : null}

      <AppDivider />

      <AppText accessibilityRole="header" weight="semibold">
        Members
      </AppText>
      {group.members.map((member) => (
        <View key={member.id} style={styles.row}>
          <View style={styles.rowBody}>
            <AppText>{member.displayName}</AppText>
            <AppText style={{ color: colors.textMuted }}>
              {member.role === 'GROUP_ADMIN' ? 'Group administrator' : 'Member'} ·{' '}
              {member._count.slots} position{member._count.slots === 1 ? '' : 's'}
            </AppText>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: fontSizes.heading },
  container: { gap: spacing.md, padding: spacing.lg },
  due: { fontSize: fontSizes.title },
  hero: { borderRadius: radius.lg, gap: spacing.xs, padding: spacing.lg },
  position: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  rowBody: { flex: 1, gap: 2 },
  stat: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
});
