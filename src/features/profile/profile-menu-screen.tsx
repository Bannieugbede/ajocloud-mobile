import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { KycStatus } from '@/api/endpoints/kyc';
import type { ReferralSummary } from '@/api/endpoints/referrals';
import type { CurrentUser } from '@/api/endpoints/users';
import { AppAmount } from '@/components/ui/app-amount';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppScreenHeader } from '@/components/ui/app-screen-header';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing, type ThemePreference } from '@/theme';

import { outstandingKycSteps, tierLabel } from './kyc-summary';

/** What the Dark Mode row says beneath its title. */
function appearanceDescription(preference: ThemePreference): string {
  if (preference === 'dark') return 'On';
  if (preference === 'light') return 'Off';
  return 'Following your phone';
}

export type ProfileMenuScreenProps = {
  user?: CurrentUser;
  kyc?: KycStatus;
  referrals?: ReferralSummary;
  /** Spendable balance in minor units, or undefined while unknown. */
  availableMinor?: string;
  savingsMinor: string;
  currency: string;
  loading: boolean;
  signingOut: boolean;
  /** Which appearance the member chose, not the mode currently resolved. */
  themePreference: ThemePreference;
  onCopyReferralCode: (code: string) => void;
  onShareReferralCode: (code: string) => void;
  /** The gear, which opens the settings the design keeps off this screen. */
  onOpenSettings: () => void;
  onOpenBankAccounts: () => void;
  onOpenTransactions: () => void;
  onOpenAppearance: () => void;
  onOpenFees: () => void;
  onOpenSupport: () => void;
  onCompleteKyc: () => void;
  onSignOut: () => void;
};

export function ProfileMenuScreen(props: ProfileMenuScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const name = props.user
    ? `${props.user.profile.firstName} ${props.user.profile.lastName}`.trim()
    : '';
  const outstanding = outstandingKycSteps(props.kyc);
  const verified = Boolean(props.kyc) && outstanding.length === 0;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm },
      ]}
      contentInsetAdjustmentBehavior="never"
    >
      <AppScreenHeader
        title="Profile"
        actions={[
          {
            icon: 'settings-outline',
            label: 'Settings',
            onPress: props.onOpenSettings,
          },
        ]}
      />

      <View style={styles.header}>
        <AppAvatar name={name || 'Member'} size={72} shape="rounded" tone="solid" />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <AppText accessibilityRole="header" weight="bold" style={styles.name}>
              {props.loading ? 'Loading…' : name || 'Member'}
            </AppText>
            {props.kyc ? <VerificationBadge verified={verified} tier={props.kyc.tier} /> : null}
          </View>
          {props.user ? (
            <>
              <AppText style={{ color: colors.textMuted }}>{props.user.email}</AppText>
              {props.user.phone ? (
                <AppText style={{ color: colors.textMuted }}>{props.user.phone}</AppText>
              ) : null}
            </>
          ) : null}
        </View>
      </View>

      <View style={[styles.wallet, { backgroundColor: colors.primary }]}>
        <AppText weight="semibold" style={styles.walletLabel}>
          WALLET SUMMARY
        </AppText>
        <View style={styles.tiles}>
          <WalletTile label="Main" amountMinor={props.availableMinor} currency={props.currency} />
          <WalletTile label="Savings" amountMinor={props.savingsMinor} currency={props.currency} />
          <WalletTile
            label="Rewards"
            amountMinor={props.referrals?.totalRewardMinor ?? '0'}
            currency={props.currency}
          />
        </View>
      </View>

      <ReferralCard
        referrals={props.referrals}
        onCopy={props.onCopyReferralCode}
        onShare={props.onShareReferralCode}
      />

      {props.kyc && outstanding.length > 0 ? (
        <AppCard>
          <AppText weight="semibold">{tierLabel(props.kyc.tier)} account</AppText>
          <AppText style={{ color: colors.textMuted }}>
            {/* Naming what is missing is more useful than a tier alone, which
                does not tell anyone what to do next. */}
            Still needed: {outstanding.join(', ')}.
          </AppText>
          <AppButton label="Finish verification" variant="outline" onPress={props.onCompleteKyc} />
        </AppCard>
      ) : null}

      <AppListItem
        card
        title="Bank Accounts"
        description="Manage the accounts you withdraw to"
        icon="card-outline"
        onPress={props.onOpenBankAccounts}
      />
      <AppListItem
        card
        title="Transaction History"
        description="View all transactions"
        icon="stats-chart-outline"
        onPress={props.onOpenTransactions}
      />
      <AppListItem
        card
        title="KYC Verification"
        description={
          verified ? 'Fully verified' : outstanding.length ? 'Not finished' : 'Not started'
        }
        icon="shield-checkmark-outline"
        onPress={props.onCompleteKyc}
        showChevron={!verified}
        trailing={
          verified ? (
            <View style={[styles.pill, { backgroundColor: colors.successSoft }]}>
              <AppText weight="semibold" style={[styles.pillText, { color: colors.success }]}>
                Verified
              </AppText>
            </View>
          ) : undefined
        }
      />
      <AppListItem
        card
        title="Dark Mode"
        description={appearanceDescription(props.themePreference)}
        icon="moon-outline"
        onPress={props.onOpenAppearance}
      />
      <AppListItem
        card
        title="Platform Fees"
        description="View fee schedule"
        icon="card-outline"
        onPress={props.onOpenFees}
      />
      <AppListItem
        card
        title="Help & Support"
        description="Chat with support"
        icon="call-outline"
        onPress={props.onOpenSupport}
      />

      <AppListItem
        card
        centered
        destructive
        title={props.signingOut ? 'Signing out…' : 'Sign Out'}
        icon="close"
        onPress={props.onSignOut}
        disabled={props.signingOut}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

function VerificationBadge({ verified, tier }: { verified: boolean; tier: string }) {
  const { colors } = useTheme();
  const background = verified ? colors.successSoft : colors.warningSoft;
  const foreground = verified ? colors.success : colors.warning;
  const label = verified ? 'KYC Verified' : tierLabel(tier);
  return (
    // The shield alone is the whole badge, so the state it carries has to be
    // in its accessible name: an icon announces nothing on its own, and colour
    // is not readable by a screen reader either.
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.badge, { backgroundColor: background }]}
    >
      <Ionicons name="shield-checkmark-outline" size={12} color={foreground} />
    </View>
  );
}

function WalletTile({
  label,
  amountMinor,
  currency,
  accent = false,
}: {
  label: string;
  amountMinor?: string;
  currency: string;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label} balance`}>
      <AppText style={styles.tileLabel}>{label}</AppText>
      {amountMinor === undefined ? (
        <AppText weight="semibold" style={styles.tileUnavailable}>
          Unavailable
        </AppText>
      ) : (
        <AppAmount
          amountMinor={amountMinor}
          currency={currency}
          onInverse
          size={'label'}
          style={accent ? { color: colors.secondary } : undefined}
        />
      )}
    </View>
  );
}

function ReferralCard({
  referrals,
  onCopy,
  onShare,
}: {
  referrals?: ReferralSummary;
  onCopy: (code: string) => void;
  onShare: (code: string) => void;
}) {
  const { colors } = useTheme();
  const code = referrals?.code ?? null;

  return (
    <AppCard style={styles.referralCard}>
      <View style={styles.rowBetween}>
        <AppText accessibilityRole="header" weight="semibold">
          Referral Code
        </AppText>
        {referrals ? (
          <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
            {referrals.referralCount} {referrals.referralCount === 1 ? 'invite' : 'invites'} ·{' '}
            {/* The earned figure is the sum of released rewards, so it always
                matches what the ledger holds. */}
            <AppAmount
              amountMinor={referrals.totalRewardMinor}
              currency={referrals.currency}
              size="caption"
            />{' '}
            earned
          </AppText>
        ) : null}
      </View>

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
              onPress={() => onCopy(code)}
              style={styles.copy}
            >
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
              <AppText weight="semibold" style={{ color: colors.primary }}>
                Copy
              </AppText>
            </Pressable>
          </View>
          <AppButton label="Invite friends and earn" onPress={() => onShare(code)} />
        </>
      ) : (
        <AppText style={{ color: colors.textMuted }}>
          Your referral code will appear here once your account is ready.
        </AppText>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  identity: { flex: 1, gap: 2 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  name: { fontSize: fontSizes.title },
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { fontSize: fontSizes.caption },

  wallet: {
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginVertical: spacing.sm,
    padding: spacing.md,
  },
  walletLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.label, letterSpacing: 1.2 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  tileLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.label },
  tileUnavailable: { color: '#FFFFFF', fontSize: fontSizes.label },

  referralCard: { gap: spacing.md, marginBottom: spacing.sm },
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

  appearance: { gap: spacing.md, marginVertical: spacing.xs },
  appearanceHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  appearanceText: { flex: 1, gap: 2 },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  segments: { borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.xs },
  segment: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },

  signOut: { marginTop: spacing.sm },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { fontSize: fontSizes.caption },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
