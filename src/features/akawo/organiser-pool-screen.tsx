import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AkawoPoolMember, OrganiserPoolView } from '@/api/endpoints/akawo-pools';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppIconButton } from '@/components/ui/app-icon-button';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppStatTiles } from '@/components/ui/app-stat-tiles';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { PoolHero } from './pool-hero';
import { PoolMemberRow } from './pool-member-row';
import { activeMembers, tallyMembers } from './pool-status';
import { deadlineLabel } from './pool-summary';

type Panel = 'overview' | 'members';

/**
 * The organiser's record. Shows every member, their reference, and whether they
 * have paid — which is the whole point of the product, and why this view is
 * separate from the member's.
 */
export function OrganiserPoolScreen({
  data,
  loading,
  error,
  refreshing,
  busy,
  onRefresh,
  onRetry,
  onOpen,
  onClose,
  onCancel,
  onShareCode,
  onExport,
  onWaive,
  onRemove,
}: {
  data?: OrganiserPoolView;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  busy: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onOpen: () => void;
  onClose: () => void;
  onCancel: () => void;
  onShareCode: () => void;
  onExport: () => void;
  onWaive: (member: AkawoPoolMember) => void;
  onRemove: (member: AkawoPoolMember) => void;
}) {
  const { colors } = useTheme();
  const [panel, setPanel] = useState<Panel>('overview');

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppSkeletonCard testID="organiser-pool-skeleton" />
        <AppSkeletonCard />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppErrorState
          title="Could not load this pool"
          description="Check your connection and try again."
          onRetry={onRetry}
        />
      </View>
    );
  }

  const isDraft = data.status === 'DRAFT';
  const isOpen = data.status === 'OPEN';
  const members = activeMembers(data.members);
  const tally = tallyMembers(data.members);

  const confirm = (title: string, message: string, action: () => void) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: action },
    ]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <PoolHero
        label="TOTAL COLLECTED"
        collectedMinor={data.collectedMinor}
        targetMinor={data.expectedMinor}
        currency={data.currency}
        dueLabel={deadlineLabel(data.dueAt)}
        paidCount={data.paidCount}
        memberCount={data.memberCount}
        progressBps={data.progressBps}
        testID="organiser-pool-hero"
      />

      {isDraft ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText weight="semibold">This pool is not open yet</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Members cannot join until you open it.
          </AppText>
          <AppButton label="Open pool" loading={busy} onPress={onOpen} />
        </View>
      ) : null}

      <AppSegmented
        label={data.name}
        value={panel}
        onChange={setPanel}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'members', label: `Members (${members.length})` },
        ]}
        testID="organiser-pool-tabs"
      />

      {panel === 'overview' ? (
        <>
          <AppCard>
            <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
              Pool Details
            </AppText>
            <DetailRow
              label="Amount per member"
              value={formatMinorAmount(data.amountMinor, data.currency)}
            />
            <DetailRow label="Due date" value={deadlineLabel(data.dueAt)} />
            <DetailRow label="Total members" value={String(members.length)} />
            <DetailRow label="Paid" value={`${tally.paid} members`} />
            <DetailRow label="Pending" value={`${tally.pending} members`} />
            <DetailRow label={data.referenceLabel} value="Collected when members join" />
          </AppCard>

          {data.purpose ? (
            <AppCard>
              <AppText accessibilityRole="header" weight="semibold" style={styles.cardTitle}>
                Description
              </AppText>
              <AppText style={{ color: colors.textMuted }}>{data.purpose}</AppText>
            </AppCard>
          ) : null}

          {isOpen ? (
            <AppButton label="Share join code" variant="outline" onPress={onShareCode} />
          ) : null}
        </>
      ) : (
        <>
          <AppStatTiles
            testID="organiser-pool-tally"
            stats={[
              { label: 'Paid', value: String(tally.paid), tone: 'success' },
              { label: 'Pending', value: String(tally.pending), tone: 'warning' },
              // The API has no partial payment: a due is pending until it is
              // settled in full. "Processing" is a payment already in flight,
              // which is the state an organiser actually needs to tell apart.
              { label: 'Processing', value: String(tally.processing), tone: 'info' },
            ]}
          />

          <AppButton
            label="Download PDF Report"
            icon="download-outline"
            variant="outline"
            onPress={onExport}
            disabled={members.length === 0}
          />

          {members.length === 0 ? (
            <AppEmptyState
              icon="person-add-outline"
              title="Nobody has joined yet"
              description="Share the join code and members can add themselves — you do not have to add them one by one."
              action="Share the join code"
              onAction={onShareCode}
            />
          ) : (
            <AppCard>
              {members.map((member, index) => (
                <View key={member.id}>
                  {index > 0 ? <AppDivider /> : null}
                  <PoolMemberRow
                    member={member}
                    currency={data.currency}
                    trailing={
                      member.due?.status === 'PENDING' ? (
                        <View style={styles.rowActions}>
                          <AppIconButton
                            icon="remove-circle-outline"
                            label={`Waive ${member.fullName}`}
                            onPress={() =>
                              confirm(
                                'Waive this member?',
                                `${member.fullName} will no longer be expected to pay. This does not record a payment.`,
                                () => onWaive(member),
                              )
                            }
                          />
                          <AppIconButton
                            icon="person-remove-outline"
                            label={`Remove ${member.fullName}`}
                            onPress={() =>
                              confirm(
                                'Remove this member?',
                                `${member.fullName} will be removed from the pool.`,
                                () => onRemove(member),
                              )
                            }
                          />
                        </View>
                      ) : null
                    }
                  />
                </View>
              ))}
            </AppCard>
          )}
        </>
      )}

      {isOpen || isDraft ? (
        <View style={styles.footer}>
          {isOpen ? (
            <AppButton
              label="Close pool"
              variant="outline"
              loading={busy}
              onPress={() =>
                confirm(
                  'Close this pool?',
                  'No further members or payments will be accepted. This cannot be undone.',
                  onClose,
                )
              }
            />
          ) : null}
          {data.paidCount === 0 ? (
            <AppButton
              label="Cancel pool"
              variant="danger"
              loading={busy}
              onPress={() =>
                confirm('Cancel this pool?', 'The pool will be cancelled permanently.', onCancel)
              }
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.detail}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight="semibold" style={styles.detailValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  notice: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },
  cardTitle: { fontSize: fontSizes.body },
  detail: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailValue: { flexShrink: 1, textAlign: 'right' },
  rowActions: { flexDirection: 'row' },
  footer: { gap: spacing.sm, marginTop: spacing.md },
});
