import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { KycStatus } from '@/api/endpoints/kyc';
import type { ReferralSummary } from '@/api/endpoints/referrals';
import type { CurrentUser } from '@/api/endpoints/users';
import { AppAmount } from '@/components/ui/app-amount';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing, type ThemePreference } from '@/theme';

import { outstandingKycSteps, tierLabel } from './kyc-summary';

const APPEARANCE_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

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
  onChangeTheme: (preference: ThemePreference) => void;
  onCopyReferralCode: (code: string) => void;
  onShareReferralCode: (code: string) => void;
  onEditProfile: () => void;
  onOpenSecurity: () => void;
  onOpenNotifications: () => void;
  onOpenInbox: () => void;
  /** Shown on the inbox row so an unread update is visible without opening it. */
  unreadCount: number;
  onOpenBankAccounts: () => void;
  onOpenTransactions: () => void;
  onOpenSupport: () => void;
  onOpenLegal: () => void;
  onCompleteKyc: () => void;
  onSignOut: () => void;
};

export function ProfileMenuScreen(props: ProfileMenuScreenProps) {
  const { colors } = useTheme();
  const name = props.user
    ? `${props.user.profile.firstName} ${props.user.profile.lastName}`.trim()
    : '';
  const outstanding = outstandingKycSteps(props.kyc);
  const verified = Boolean(props.kyc) && outstanding.length === 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <AppAvatar name={name || 'Member'} size={72} />
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
            accent
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
        title="Bank Accounts"
        description="Manage the accounts you withdraw to"
        icon="card-outline"
        onPress={props.onOpenBankAccounts}
      />
      <AppListItem
        title="Transaction History"
        description="View all transactions"
        icon="stats-chart-outline"
        onPress={props.onOpenTransactions}
      />
      <AppListItem
        title="KYC Verification"
        description={
          verified ? 'Fully verified' : outstanding.length ? 'Not finished' : 'Not started'
        }
        icon="shield-checkmark-outline"
        onPress={props.onCompleteKyc}
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

      <AppearanceRow preference={props.themePreference} onChange={props.onChangeTheme} />

      <AppListItem
        title={
          props.unreadCount > 0
            ? `Notifications (${String(props.unreadCount)} new)`
            : 'Notifications'
        }
        description="Your updates and alerts"
        icon="mail-outline"
        onPress={props.onOpenInbox}
      />
      <AppListItem title="Edit profile" icon="person-outline" onPress={props.onEditProfile} />
      <AppListItem title="Security" icon="lock-closed-outline" onPress={props.onOpenSecurity} />
      <AppListItem
        title="Notification settings"
        icon="notifications-outline"
        onPress={props.onOpenNotifications}
      />
      <AppListItem title="Get help" icon="help-buoy-outline" onPress={props.onOpenSupport} />
      <AppListItem
        title="Privacy and terms"
        icon="document-text-outline"
        onPress={props.onOpenLegal}
      />

      <AppDivider />

      <AppButton
        label="Sign out"
        variant="outline"
        onPress={props.onSignOut}
        loading={props.signingOut}
        disabled={props.signingOut}
      />
    </ScrollView>
  );
}

function VerificationBadge({ verified, tier }: { verified: boolean; tier: string }) {
  const { colors } = useTheme();
  const background = verified ? colors.successSoft : colors.warningSoft;
  const foreground = verified ? colors.success : colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Ionicons name="shield-checkmark-outline" size={12} color={foreground} />
      <AppText weight="semibold" style={[styles.badgeText, { color: foreground }]}>
        {verified ? 'KYC Verified' : tierLabel(tier)}
      </AppText>
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

function AppearanceRow({
  preference,
  onChange,
}: {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}) {
  const { colors } = useTheme();
  return (
    <AppCard style={styles.appearance}>
      <View style={styles.appearanceHeader}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.icon, { backgroundColor: colors.primarySoft }]}
        >
          <Ionicons name="moon-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.appearanceText}>
          <AppText weight="semibold">Appearance</AppText>
          <AppText style={{ color: colors.textMuted }}>
            {/* "System" is the default and follows the phone, which is what
                most people expect without having to choose. */}
            Follow your phone, or pick a mode
          </AppText>
        </View>
      </View>
      <View
        accessibilityRole="radiogroup"
        style={[styles.segments, { backgroundColor: colors.surfaceMuted }]}
      >
        {APPEARANCE_OPTIONS.map((option) => {
          const selected = option.value === preference;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} appearance`}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected ? { backgroundColor: colors.primary } : null]}
            >
              <AppText
                weight={selected ? 'semibold' : 'regular'}
                style={{ color: selected ? colors.textInverse : colors.text }}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  identity: { flex: 1, gap: 2 },
  nameRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  name: { fontSize: fontSizes.title },
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: { fontSize: fontSizes.caption },

  wallet: {
    borderRadius: radius.lg,
    gap: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.lg,
  },
  walletLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption, letterSpacing: 1.2 },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  tileLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption },
  tileUnavailable: { color: '#FFFFFF', fontSize: fontSizes.caption },

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

  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { fontSize: fontSizes.caption },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
