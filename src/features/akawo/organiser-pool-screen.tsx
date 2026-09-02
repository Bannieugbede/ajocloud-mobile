import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AkawoPoolMember, OrganiserPoolView } from '@/api/endpoints/akawo-pools';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppIconButton } from '@/components/ui/app-icon-button';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { statusLabel } from '@/utils/status';

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
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <AppText style={styles.heroLabel}>COLLECTED</AppText>
        <AppAmount
          amountMinor={data.collectedMinor}
          currency={data.currency}
          size="heading"
          onInverse
        />
        <AppText style={styles.heroLabel}>
          {data.paidCount} of {data.memberCount} paid · {statusLabel(data.status)}
        </AppText>
      </View>

      {data.memberCount > 0 ? (
        <AppProgress progressBps={data.progressBps} label={`${data.name} collection`} />
      ) : null}

      {isDraft ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText weight="semibold">This pool is not open yet</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Members cannot join until you open it.
          </AppText>
          <AppButton label="Open pool" loading={busy} onPress={onOpen} />
        </View>
      ) : null}

      <View style={styles.actions}>
        {isOpen ? (
          <AppButton
            label="Share code"
            variant="outline"
            onPress={onShareCode}
            style={styles.action}
          />
        ) : null}
        <AppButton
          label="Export record"
          variant="outline"
          onPress={onExport}
          style={styles.action}
          disabled={data.memberCount === 0}
        />
      </View>

      <AppText accessibilityRole="header" weight="semibold">
        Members
      </AppText>

      {data.members.length === 0 ? (
        <AppEmptyState
          icon="person-add-outline"
          title="Nobody has joined yet"
          description="Share the join code so members can add themselves."
        />
      ) : (
        <AppCard>
          {data.members.map((member, index) => (
            <View key={member.id}>
              {index > 0 ? <AppDivider /> : null}
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <AppText weight="medium">{member.fullName}</AppText>
                  <AppText style={[styles.meta, { color: colors.textMuted }]}>
                    {member.reference} · {member.due ? statusLabel(member.due.status) : 'No due'}
                  </AppText>
                </View>
                {member.due?.status === 'PENDING' ? (
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
                ) : null}
              </View>
            </View>
          ))}
        </AppCard>
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

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  heroLabel: { color: 'rgba(255,255,255,0.78)', fontSize: fontSizes.caption, letterSpacing: 1.1 },
  notice: { borderRadius: radius.md, gap: spacing.sm, padding: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  rowText: { flex: 1, gap: 2 },
  rowActions: { flexDirection: 'row' },
  meta: { fontSize: fontSizes.caption },
  footer: { gap: spacing.sm, marginTop: spacing.md },
});
