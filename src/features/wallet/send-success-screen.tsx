import { ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

/**
 * A wallet-to-wallet transfer that settled.
 *
 * The money is already with the recipient — the ledger settles immediately —
 * so this states what moved and where, with the reference for any follow-up.
 * Reached by replace, so there is no form behind it offering to send again.
 */
export function SendSuccessScreen({
  recipientEmail,
  amountMinor,
  currency,
  reference,
  onDone,
}: {
  recipientEmail: string;
  amountMinor: string;
  currency: string;
  reference?: string;
  onDone: () => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        <View style={[styles.medallion, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="checkmark-circle" size={44} color={colors.success} />
        </View>
        <AppText accessibilityRole="header" weight="bold" style={styles.heading}>
          Money sent
        </AppText>
        <AppAmount amountMinor={amountMinor} currency={currency} size="heading" />
        <AppText style={{ color: colors.textMuted }}>To {recipientEmail}</AppText>
        {reference ? (
          <View style={[styles.reference, { backgroundColor: colors.surfaceMuted }]}>
            <AppText style={[styles.referenceText, { color: colors.textMuted }]}>
              Reference: {reference}
            </AppText>
          </View>
        ) : null}
      </View>

      <AppButton label="Done" onPress={onDone} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  medallion: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  heading: { fontSize: fontSizes.heading },
  reference: {
    borderRadius: radius.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  referenceText: { fontSize: fontSizes.caption },
});
