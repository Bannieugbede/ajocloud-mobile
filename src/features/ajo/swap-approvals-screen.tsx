import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AjoSwapRequest } from '@/api/endpoints/ajo-groups';
import type { AppError } from '@/types/errors';

import {
  canDecide,
  deadlineLabel,
  otherSwaps,
  pendingMyDecision,
  statusLabel,
  swapSummary,
} from './swap-approvals';

/**
 * Swap requests on a group, with the ones needing this member's decision first.
 *
 * Approving is what actually rewrites the rotation, so the card states the
 * consequence rather than only naming the two members: agreeing to move
 * position changes when you are paid.
 */
export function SwapApprovalsScreen({
  swaps,
  now,
  deciding,
  error,
  onApprove,
  onReject,
}: {
  swaps: AjoSwapRequest[];
  now: Date;
  deciding: string | null;
  error?: AppError | null;
  onApprove: (swap: AjoSwapRequest) => void;
  onReject: (swap: AjoSwapRequest) => void;
}) {
  const { colors } = useTheme();
  const mine = pendingMyDecision(swaps);
  const rest = otherSwaps(swaps);

  const card = (swap: AjoSwapRequest, actionable: boolean) => {
    const deadline = deadlineLabel(swap, now);
    return (
      <AppCard key={swap.id}>
        <AppText weight="semibold">{swapSummary(swap)}</AppText>
        {swap.reason ? (
          <AppText style={{ color: colors.textMuted }}>Reason: {swap.reason}</AppText>
        ) : null}
        <AppText style={{ color: colors.textMuted }}>{statusLabel(swap)}</AppText>
        {deadline ? <AppText style={{ color: colors.textMuted }}>{deadline}</AppText> : null}

        {actionable ? (
          <>
            <AppText style={{ color: colors.textMuted }}>
              Approving moves both positions in the rotation, which changes when each of you is
              paid.
            </AppText>
            <View style={styles.actions}>
              <AppButton
                label="Approve"
                loading={deciding === swap.id}
                disabled={deciding !== null}
                onPress={() => onApprove(swap)}
              />
              <AppButton
                label="Decline"
                variant="danger"
                disabled={deciding !== null}
                onPress={() => onReject(swap)}
              />
            </View>
          </>
        ) : null}
      </AppCard>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {error ? (
        <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
          {error.message}
        </AppText>
      ) : null}

      {mine.length > 0 ? (
        <>
          <AppText accessibilityRole="header" weight="semibold">
            Waiting for you
          </AppText>
          {mine.map((swap) => card(swap, canDecide(swap, now)))}
        </>
      ) : null}

      {rest.length > 0 ? (
        <>
          <AppText accessibilityRole="header" weight="semibold">
            {mine.length > 0 ? 'Other requests' : 'Swap requests'}
          </AppText>
          {rest.map((swap) => card(swap, false))}
        </>
      ) : null}

      {swaps.length === 0 ? (
        <AppCard>
          <AppText weight="semibold">No swap requests</AppText>
          <AppText style={{ color: colors.textMuted }}>
            When someone asks to trade positions with you, it will appear here.
          </AppText>
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
