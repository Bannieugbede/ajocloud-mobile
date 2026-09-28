import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
  /** Kept for the Rewards tile; the code itself lives on the Referrals screen. */
  referrals?: ReferralSummary;
  /** Spendable balance in minor units, or undefined while unknown. */
  availableMinor?: string;
  savingsMinor: string;
  currency: string;
  loading: boolean;
  signingOut: boolean;
  /** Which appearance the member chose, not the mode currently resolved. */
  themePreference: ThemePreference;
  /** The gear, which opens the settings the design keeps off this screen. */
  onOpenSettings: () => void;
  onOpenBankAccounts: () => void;
  onOpenReferrals: () => void;
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
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

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

      <WalletSummary
        availableMinor={props.availableMinor}
        savingsMinor={props.savingsMinor}
        rewardsMinor={props.referrals?.totalRewardMinor ?? '0'}
        currency={props.currency}
      />

      <AppListItem
        card
        title="Referrals"
        description={
          props.referrals
            ? `${props.referrals.referralCount} ${props.referrals.referralCount === 1 ? 'invite' : 'invites'} · Invite friends and earn`
            : 'Invite friends and earn'
        }
        icon="gift-outline"
        onPress={props.onOpenReferrals}
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

      <SignOutButton signingOut={props.signingOut} onPress={() => setConfirmingSignOut(true)} />
      <SignOutDialog
        visible={confirmingSignOut}
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          // Closed before signing out, so the dialog is never left standing
          // over the auth screens that replace this stack.
          setConfirmingSignOut(false);
          props.onSignOut();
        }}
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

/**
 * What the member holds, as three labelled rows rather than three tiles.
 *
 * The figures are different kinds of money — spendable now, locked in goals,
 * earned from referrals — so they read as a list with each kind named, not as
 * three equal boxes inviting them to be added up.
 */
function WalletSummary({
  availableMinor,
  savingsMinor,
  rewardsMinor,
  currency,
}: {
  availableMinor?: string;
  savingsMinor: string;
  rewardsMinor: string;
  currency: string;
}) {
  const { colors } = useTheme();
  return (
    <AppCard style={styles.wallet}>
      <AppText accessibilityRole="header" weight="semibold" style={styles.walletTitle}>
        Wallet Summary
      </AppText>
      <BalanceRow
        icon="wallet-outline"
        label="Main"
        caption="Available to spend"
        amountMinor={availableMinor}
        currency={currency}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <BalanceRow
        icon="trending-up-outline"
        label="Savings"
        caption="Across Akawo goals"
        amountMinor={savingsMinor}
        currency={currency}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <BalanceRow
        icon="gift-outline"
        label="Rewards"
        caption="Referral earnings"
        amountMinor={rewardsMinor}
        currency={currency}
      />
    </AppCard>
  );
}

function BalanceRow({
  icon,
  label,
  caption,
  amountMinor,
  currency,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  caption: string;
  amountMinor?: string;
  currency: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={
        amountMinor === undefined ? `${label} balance unavailable` : `${label} balance`
      }
      style={styles.balanceRow}
    >
      <View style={[styles.balanceIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.balanceText}>
        <AppText weight="semibold">{label}</AppText>
        <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
          {caption}
        </AppText>
      </View>
      {amountMinor === undefined ? (
        // A balance that could not be read is not a zero balance.
        <AppText weight="semibold" style={[styles.unavailable, { color: colors.textMuted }]}>
          Unavailable
        </AppText>
      ) : (
        <AppAmount amountMinor={amountMinor} currency={currency} />
      )}
    </View>
  );
}

/**
 * Signing out, centred with its icon rather than as another settings row.
 *
 * Leaving an account is a deliberate act, so the control looks like one —
 * and it confirms first, because a stray tap should never end a session.
 */
function SignOutButton({ signingOut, onPress }: { signingOut: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={signingOut ? 'Signing out' : 'Sign Out'}
      accessibilityState={{ disabled: signingOut }}
      disabled={signingOut}
      onPress={onPress}
      testID="sign-out-row"
      style={(state) => [
        styles.signOut,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: signingOut ? 0.6 : state.pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.signOutIcon, { backgroundColor: colors.errorSoft }]}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
      </View>
      <AppText weight="semibold" style={{ color: colors.error }}>
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </AppText>
    </Pressable>
  );
}

function SignOutDialog({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
      testID="sign-out-dialog"
    >
      <View style={styles.dialogScreen}>
        {/* Tapping outside confirms nothing; it only closes. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel sign out"
          onPress={onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
        />
        <View
          style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={[styles.dialogIcon, { backgroundColor: colors.errorSoft }]}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </View>
          <AppText accessibilityRole="header" weight="bold" style={styles.dialogTitle}>
            Sign out?
          </AppText>
          <AppText style={[styles.dialogMessage, { color: colors.textMuted }]}>
            You will need to sign in again to access your groups and wallet.
          </AppText>
          <View style={styles.dialogActions}>
            <AppButton
              label="Cancel"
              variant="outline"
              onPress={onCancel}
              style={styles.dialogAction}
            />
            <AppButton
              label="Sign Out"
              variant="danger"
              onPress={onConfirm}
              testID="sign-out-confirm"
              style={styles.dialogAction}
            />
          </View>
        </View>
      </View>
    </Modal>
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

  wallet: { gap: spacing.md },
  walletTitle: { fontSize: fontSizes.title - 4 },
  balanceRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  balanceIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  balanceText: { flex: 1, gap: 2 },
  unavailable: { fontSize: fontSizes.caption },
  divider: { height: 1, width: '100%' },

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

  signOut: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: sizes.touchTarget + 8,
    paddingHorizontal: spacing.md,
  },
  signOutIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  dialogScreen: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  dialog: {
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  dialogIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  dialogTitle: { fontSize: fontSizes.title, textAlign: 'center' },
  dialogMessage: { textAlign: 'center' },
  dialogActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  dialogAction: { flex: 1 },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { fontSize: fontSizes.caption },
});
