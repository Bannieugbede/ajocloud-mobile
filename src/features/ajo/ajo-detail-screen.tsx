import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { AjoCycle, AjoGroupDetail } from '@/api/endpoints/ajo-groups';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppHero } from '@/components/ui/app-hero';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppStatTiles } from '@/components/ui/app-stat-tiles';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { longDate, shortDate } from '@/utils/dates';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  buildRotation,
  canLock,
  canRequestSwap,
  currentRotationSequence,
  lockBlockedReason,
  outstandingContributions,
  rotationStatusLabel,
  rotationStatusTone,
} from './rotation';

type Panel = 'rotation' | 'members';

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
  onViewSwaps,
  swapsAwaitingMe,
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
  onViewSwaps: () => void;
  /** Requests needing this member's decision, so the entry point says so
      rather than making them open the screen to find out. */
  swapsAwaitingMe: number;
  onPayContribution: (input: {
    scheduleId: string;
    amountMinor: string;
    amountPaidMinor: string;
    currency: string;
    sequence: number;
  }) => void;
}) {
  const { colors } = useTheme();
  const [panel, setPanel] = useState<Panel>('rotation');

  if (loading) return <AppLoadingState label="Loading this Ajo group" />;
  if (error || !group) {
    return <AppErrorState description="Could not load this Ajo group." onRetry={onRetry} />;
  }

  const rotation = buildRotation(cycles ?? [], group, viewerUserId);
  const outstanding = outstandingContributions(cycles ?? [], group, viewerUserId);
  const nextDue = outstanding[0];
  const lockBlocked = lockBlockedReason(group);
  const currentSequence = currentRotationSequence(rotation);

  const mySlots = rotation.filter((row) => row.isMine);
  const myPosition = mySlots.length ? Math.min(...mySlots.map((row) => row.position)) : null;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AppStatTiles
        testID="ajo-group-stats"
        stats={[
          { label: 'Members', value: String(group.members.length) },
          { label: 'My Slots', value: String(mySlots.length) },
          {
            label: 'Position',
            value: myPosition === null ? '—' : `${myPosition}/${group.maxSlots}`,
          },
        ]}
      />

      <AppHero
        testID="ajo-group-hero"
        label="CONTRIBUTION EACH ROUND"
        amountMinor={group.baseContributionMinor}
        currency={group.currency}
        meta={`${statusLabel(group.contributionFrequency)} · ${statusLabel(group.status)}`}
        progressBps={
          rotation.length
            ? Math.round(
                (rotation.filter((row) => row.status.toUpperCase() === 'PAID').length /
                  rotation.length) *
                  10_000,
              )
            : undefined
        }
        progressLabel={`${group.name} rotation`}
        footer={
          currentSequence === null
            ? undefined
            : [`Round ${currentSequence}/${rotation.length}`, `${group.slots.length} positions`]
        }
      />

      {nextDue ? (
        <AppCard>
          <View style={styles.rowBetween}>
            <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
              Your next contribution
            </AppText>
            <AppBadge label={`Round ${nextDue.sequence}`} tone="info" />
          </View>
          <AppText style={{ color: colors.textMuted }}>Due {longDate(nextDue.dueAt)}</AppText>
          <AppText weight="bold" style={styles.due}>
            {formatMinorAmount(nextDue.amountMinor, nextDue.currency)}
          </AppText>
          <AppButton
            label="Pay contribution"
            onPress={() =>
              onPayContribution({
                scheduleId: nextDue.scheduleId,
                amountMinor: nextDue.amountMinor,
                amountPaidMinor: nextDue.amountPaidMinor,
                currency: nextDue.currency,
                sequence: nextDue.sequence,
              })
            }
          />
        </AppCard>
      ) : null}

      {canLock(group, viewerUserId) ? (
        <AppCard>
          <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
            This rotation has not started
          </AppText>
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

      <AppSegmented
        label={group.name}
        value={panel}
        onChange={setPanel}
        options={[
          { value: 'rotation', label: 'Rotation' },
          { value: 'members', label: `Members (${group.members.length})` },
        ]}
        testID="ajo-group-tabs"
      />

      {panel === 'rotation' ? (
        rotation.length === 0 ? (
          <AppCard>
            <AppText style={{ color: colors.textMuted }}>
              The order is set when the group is locked.
            </AppText>
          </AppCard>
        ) : (
          <AppCard>
            {rotation.map((entry, index) => {
              const isCurrent = entry.sequence === currentSequence;
              const label = rotationStatusLabel(entry.status, isCurrent);
              const name = entry.isMine ? `${entry.holderName} (You)` : entry.holderName;

              return (
                <View key={`${entry.sequence}-${entry.slotId}`}>
                  {index > 0 ? <AppDivider /> : null}
                  <View
                    accessible
                    accessibilityLabel={`Position ${entry.position}, ${name}, ${label}, ${shortDate(
                      entry.payoutDueAt,
                    )}, ${formatMinorAmount(entry.amountDueMinor, entry.currency)}`}
                    style={styles.row}
                  >
                    <View
                      style={[
                        styles.position,
                        {
                          backgroundColor: isCurrent ? colors.warningSoft : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <AppText
                        weight="bold"
                        style={{ color: isCurrent ? colors.warning : colors.textMuted }}
                      >
                        {entry.position}
                      </AppText>
                    </View>

                    <View style={styles.rowBody}>
                      <AppText
                        weight="semibold"
                        numberOfLines={1}
                        style={entry.isMine ? { color: colors.primary } : undefined}
                      >
                        {name}
                      </AppText>
                      <AppText style={[styles.meta, { color: colors.textMuted }]}>
                        {shortDate(entry.payoutDueAt)}
                      </AppText>
                    </View>

                    <View style={styles.rowTrailing}>
                      <AppText weight="bold" numberOfLines={1}>
                        {formatMinorAmount(entry.amountDueMinor, entry.currency)}
                      </AppText>
                      <AppBadge label={label} tone={rotationStatusTone(entry.status, isCurrent)} />
                    </View>
                  </View>
                </View>
              );
            })}
          </AppCard>
        )
      ) : (
        <AppCard>
          {group.members.map((member, index) => (
            <View key={member.id}>
              {index > 0 ? <AppDivider /> : null}
              <View
                accessible
                accessibilityLabel={`${member.displayName}, ${
                  member.role === 'GROUP_ADMIN' ? 'Group administrator' : 'Member'
                }, ${member._count.slots} position${member._count.slots === 1 ? '' : 's'}`}
                style={styles.row}
              >
                <AppAvatar name={member.displayName} size={40} />
                <View style={styles.rowBody}>
                  <AppText weight="semibold" numberOfLines={1}>
                    {member.displayName}
                  </AppText>
                  <AppText style={[styles.meta, { color: colors.textMuted }]}>
                    {member._count.slots} position{member._count.slots === 1 ? '' : 's'}
                  </AppText>
                </View>
                {member.role === 'GROUP_ADMIN' ? <AppBadge label="Admin" tone="info" /> : null}
              </View>
            </View>
          ))}
        </AppCard>
      )}

      <View style={styles.actions}>
        {canRequestSwap(group) ? (
          <AppButton
            label="Ask to swap positions"
            icon="swap-horizontal-outline"
            variant="outline"
            onPress={onRequestSwap}
          />
        ) : null}

        <AppButton
          label={
            swapsAwaitingMe > 0
              ? `Swap requests (${String(swapsAwaitingMe)} need you)`
              : 'Swap requests'
          }
          variant={swapsAwaitingMe > 0 ? 'primary' : 'ghost'}
          onPress={onViewSwaps}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  cardTitle: { fontSize: fontSizes.body },
  due: { fontSize: fontSizes.title },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  position: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  rowBody: { flex: 1, gap: 2 },
  rowTrailing: { alignItems: 'flex-end', gap: spacing.xs },
  meta: { fontSize: fontSizes.caption },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
