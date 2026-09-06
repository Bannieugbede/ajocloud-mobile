import { ScrollView, StyleSheet } from 'react-native';

import { AppBadge } from '@/components/ui/app-badge';
import { AppListItem } from '@/components/ui/app-list-item';
import { AppSection } from '@/components/ui/app-section';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

/**
 * Account settings, behind the gear on Profile.
 *
 * Profile itself is the member's own summary — who they are, what they hold,
 * and the things they reach for often. The rows here are configuration, opened
 * once and rarely again, so they sit one level down rather than lengthening the
 * screen they are least often wanted on.
 */
export function SettingsScreen({
  unreadCount,
  onEditProfile,
  onOpenSecurity,
  onOpenNotifications,
  onOpenInbox,
  onOpenLegal,
}: {
  /** Shown on the inbox row so an unread update is visible without opening it. */
  unreadCount: number;
  onEditProfile: () => void;
  onOpenSecurity: () => void;
  onOpenNotifications: () => void;
  onOpenInbox: () => void;
  onOpenLegal: () => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AppSection title="ACCOUNT">
        <AppListItem
          card
          title="Edit profile"
          description="Your name and contact details"
          icon="person-outline"
          onPress={onEditProfile}
        />
        <AppListItem
          card
          title="Security"
          description="Password, PIN and devices"
          icon="lock-closed-outline"
          onPress={onOpenSecurity}
        />
      </AppSection>

      <AppSection title="NOTIFICATIONS">
        <AppListItem
          card
          title="Inbox"
          description="Your updates and alerts"
          icon="mail-outline"
          onPress={onOpenInbox}
          trailing={
            unreadCount > 0 ? <AppBadge label={`${unreadCount} new`} tone="info" /> : undefined
          }
        />
        <AppListItem
          card
          title="Notification settings"
          description="Choose what we tell you about"
          icon="notifications-outline"
          onPress={onOpenNotifications}
        />
      </AppSection>

      <AppSection title="LEGAL">
        <AppListItem
          card
          title="Privacy and terms"
          description="How we handle your data"
          icon="document-text-outline"
          onPress={onOpenLegal}
        />
      </AppSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.md, paddingBottom: spacing.xxl },
});
