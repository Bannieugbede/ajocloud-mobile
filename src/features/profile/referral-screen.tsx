import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ReferralSummary } from '@/api/endpoints/referrals';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

/**
 * The member's referral code, earnings and invites in one place.
 *
 * Moved out of the profile menu so the menu stays a list of destinations:
 * a code to copy and a button to share are actions, not navigation, and they
 * crowded everything beneath them.
 */
export function ReferralScreen({
  referrals,
  onCopyReferralCode,
  onShareReferralCode,
}: {
  referrals?: ReferralSummary;
  onCopyReferralCode: (code: string) => void;
  onShareReferralCode: (code: string) => void;
}) {
  const { colors } = useTheme();
  const code = referrals?.code ?? null;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.summary, { backgroundColor: colors.primarySoft }]}>
        <AppText accessibilityRole="header" weight="bold" style={styles.summaryTitle}>
          Invite friends, earn together
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          Share your code. You earn when someone you invited funds their wallet and joins a group.
        </AppText>
        {referrals ? (
          <View style={styles.stats}>
            <Stat label="Invites">
              <AppText weight="bold">
                {`${referrals.referralCount} ${referrals.referralCount === 1 ? 'invite' : 'invites'}`}
              </AppText>
            </Stat>
            <Stat label="Earned">
              <AppAmount
                amountMinor={referrals.totalRewardMinor}
                currency={referrals.currency}
                size="title"
              />
            </Stat>
          </View>
        ) : null}
      </View>

      <AppCard style={styles.card}>
        <AppText accessibilityRole="header" weight="semibold">
          Referral Code
        </AppText>

        {code ? (
          <>
            <View style={[styles.codeRow, { backgroundColor: colors.primarySoft }]}>
              <AppText weight="semibold" style={[styles.code, { color: colors.primary }]}>
                {code}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Copy referral code ${code}`}
                hitSlop={8}
                onPress={() => onCopyReferralCode(code)}
                style={styles.copy}
              >
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <AppText weight="semibold" style={{ color: colors.primary }}>
                  Copy
                </AppText>
              </Pressable>
            </View>
            <AppButton label="Invite friends and earn" onPress={() => onShareReferralCode(code)} />
          </>
        ) : (
          <AppText style={{ color: colors.textMuted }}>
            Your referral code will appear here once your account is ready.
          </AppText>
        )}
      </AppCard>
    </ScrollView>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View>
      <AppText style={[styles.statLabel, { color: colors.textMuted }]}>{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  summary: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  summaryTitle: { fontSize: fontSizes.title },
  stats: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xs },
  statLabel: { fontSize: fontSizes.caption },
  card: { gap: spacing.md },
  codeRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  code: { flex: 1, fontSize: fontSizes.body, letterSpacing: 1.5 },
  copy: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, padding: spacing.xs },
});
