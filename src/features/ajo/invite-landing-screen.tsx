import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { GroupInvitePreview } from '@/api/endpoints/ajo-groups';
import type { AppError } from '@/types/errors';
import { formatMinorAmount } from '@/utils/money';

/** Frequency labels as a person would say them, not as the enum spells them. */
const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'every day',
  WEEKLY: 'every week',
  BIWEEKLY: 'every two weeks',
  MONTHLY: 'every month',
  QUARTERLY: 'every quarter',
};

export function frequencyLabel(frequency: string): string {
  return FREQUENCY_LABELS[frequency] ?? frequency.toLowerCase().replace(/_/g, ' ');
}

/**
 * What someone sees after opening an invitation link.
 *
 * The group is named before anything is asked of the reader: they arrived from
 * a message, possibly forwarded, and the first thing they need to know is what
 * they have been invited to and by whom.
 */
export function InviteLandingScreen({
  preview,
  loading,
  error,
  submitting,
  signedIn,
  onAccept,
  onDecline,
}: {
  preview: GroupInvitePreview | null;
  loading: boolean;
  error?: AppError | null;
  submitting: boolean;
  /** Drives the wording only: an invitation survives sign-in either way. */
  signedIn: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.centred, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={{ color: colors.textMuted }}>Opening your invitation…</AppText>
      </View>
    );
  }

  if (error || !preview) {
    return (
      <View style={[styles.centred, { backgroundColor: colors.background }]}>
        <AppText weight="semibold" style={[styles.heading, { color: colors.text }]}>
          This invitation isn&apos;t available
        </AppText>
        <AppText style={[styles.centredText, { color: colors.textMuted }]}>
          {error?.message ??
            'It may have expired or already been used. Ask whoever sent it for a new one.'}
        </AppText>
        <AppButton label="Back to my groups" onPress={onDecline} />
      </View>
    );
  }

  const spotsLeft = Math.max(0, preview.maxMembers - preview.memberCount);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AppText style={{ color: colors.textMuted }}>
        {preview.inviterName} invited you to join
      </AppText>
      <AppText weight="bold" style={[styles.heading, { color: colors.text }]}>
        {preview.groupName}
      </AppText>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Detail
          label="Contribution"
          value={`${formatMinorAmount(preview.contributionAmountMinor, preview.currency)} ${frequencyLabel(
            preview.contributionFrequency,
          )}`}
        />
        <Detail
          label="Members"
          value={
            spotsLeft > 0
              ? `${preview.memberCount} joined · ${spotsLeft} ${
                  spotsLeft === 1 ? 'spot' : 'spots'
                } left`
              : `${preview.memberCount} joined`
          }
        />
      </View>

      <AppText style={{ color: colors.textMuted }}>
        {signedIn
          ? 'You choose how many positions to take on the next step. Nothing is collected until the group starts.'
          : 'Sign in or create an account to accept. We’ll bring you straight back here.'}
      </AppText>

      <AppButton
        label={signedIn ? 'Continue' : 'Sign in to accept'}
        onPress={onAccept}
        loading={submitting}
        disabled={submitting}
      />
      <AppButton label="Not now" variant="secondary" onPress={onDecline} disabled={submitting} />
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText style={[styles.value, { color: colors.text }]}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  centred: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  centredText: { textAlign: 'center' },
  heading: { fontSize: 22, lineHeight: 28 },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  value: { flexShrink: 1, textAlign: 'right' },
});
