import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { InAppNotification } from '@/api/endpoints/notifications';

import { groupByDay } from './notification-list';

/**
 * The in-app notification list.
 *
 * This is the reliable channel: push is a prompt to open the app, and someone
 * who declined permission still sees everything here. Unread entries are marked
 * with a dot and a word, never colour alone.
 */
export function NotificationsInboxScreen({
  notifications,
  unreadCount,
  now,
  refreshing,
  onRefresh,
  onOpen,
  onMarkAllRead,
}: {
  notifications: InAppNotification[];
  unreadCount: number;
  now: Date;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (notification: InAppNotification) => void;
  onMarkAllRead: () => void;
}) {
  const { colors } = useTheme();
  const groups = groupByDay(notifications, now);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {unreadCount > 0 ? (
        <AppButton label="Mark all as read" variant="ghost" onPress={onMarkAllRead} />
      ) : null}

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <AppText accessibilityRole="header" weight="semibold">
            {group.label}
          </AppText>
          {group.items.map((notification) => {
            const unread = notification.readAt === null;
            return (
              <Pressable
                key={notification.id}
                onPress={() => onOpen(notification)}
                accessibilityRole="button"
                accessibilityLabel={`${notification.title ?? 'Notification'}${
                  unread ? ', unread' : ''
                }`}
              >
                <AppCard>
                  <View style={styles.row}>
                    <View style={styles.body}>
                      <AppText weight={unread ? 'semibold' : 'regular'}>
                        {notification.title ?? 'Notification'}
                      </AppText>
                      {notification.body ? (
                        <AppText style={{ color: colors.textMuted }}>{notification.body}</AppText>
                      ) : null}
                    </View>
                    {/* A word as well as a dot: status must not be carried by
                        colour or shape alone. */}
                    {unread ? (
                      <AppText style={{ color: colors.primary }} weight="semibold">
                        New
                      </AppText>
                    ) : null}
                  </View>
                </AppCard>
              </Pressable>
            );
          })}
        </View>
      ))}

      {notifications.length === 0 ? (
        <AppCard>
          <AppText weight="semibold">Nothing yet</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Updates about your groups, savings and payments will appear here.
          </AppText>
        </AppCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  group: { gap: spacing.sm },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  body: { flex: 1, gap: spacing.xs },
});
