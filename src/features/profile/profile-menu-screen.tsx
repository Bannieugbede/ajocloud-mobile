import { ScrollView, StyleSheet, View } from 'react-native';

import type { CurrentUser } from '@/api/endpoints/users';
import type { KycStatus } from '@/api/endpoints/kyc';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { outstandingKycSteps, tierLabel } from './kyc-summary';

export function ProfileMenuScreen({
  user,
  kyc,
  loading,
  signingOut,
  onEditProfile,
  onOpenSecurity,
  onOpenNotifications,
  onOpenInbox,
  unreadCount,
  onOpenSupport,
  onOpenLegal,
  onCompleteKyc,
  onSignOut,
}: {
  user?: CurrentUser;
  kyc?: KycStatus;
  loading: boolean;
  signingOut: boolean;
  onEditProfile: () => void;
  onOpenSecurity: () => void;
  onOpenNotifications: () => void;
  onOpenInbox: () => void;
  /** Shown on the inbox row so an unread update is visible without opening it. */
  unreadCount: number;
  onOpenSupport: () => void;
  onOpenLegal: () => void;
  onCompleteKyc: () => void;
  onSignOut: () => void;
}) {
  const { colors } = useTheme();
  const name = user ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : '';
  const outstanding = outstandingKycSteps(kyc);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <AppAvatar name={name || 'Member'} size={64} />
        <AppText accessibilityRole="header" weight="bold" style={styles.name}>
          {loading ? 'Loading…' : name || 'Member'}
        </AppText>
        {user ? <AppText style={{ color: colors.textMuted }}>{user.email}</AppText> : null}
      </View>

      {kyc ? (
        <AppCard>
          <AppText weight="semibold">{tierLabel(kyc.tier)} account</AppText>
          {outstanding.length > 0 ? (
            <>
              <AppText style={{ color: colors.textMuted }}>
                {/* Naming what is missing is more useful than a tier alone,
                    which does not tell anyone what to do next. */}
                Still needed: {outstanding.join(', ')}.
              </AppText>
              <AppButton label="Finish verification" variant="outline" onPress={onCompleteKyc} />
            </>
          ) : (
            <AppText style={{ color: colors.textMuted }}>Your verification is complete.</AppText>
          )}
        </AppCard>
      ) : null}

      <AppListItem
        title={unreadCount > 0 ? `Notifications (${String(unreadCount)} new)` : 'Notifications'}
        icon="mail-outline"
        onPress={onOpenInbox}
      />
      <AppListItem title="Edit profile" icon="person-outline" onPress={onEditProfile} />
      <AppListItem title="Security" icon="lock-closed-outline" onPress={onOpenSecurity} />
      <AppListItem
        title="Notification settings"
        icon="notifications-outline"
        onPress={onOpenNotifications}
      />
      <AppListItem title="Get help" icon="help-buoy-outline" onPress={onOpenSupport} />
      <AppListItem title="Privacy and terms" icon="document-text-outline" onPress={onOpenLegal} />

      <AppDivider />

      <AppButton
        label="Sign out"
        variant="outline"
        onPress={onSignOut}
        loading={signingOut}
        disabled={signingOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  name: { fontSize: fontSizes.title },
});
