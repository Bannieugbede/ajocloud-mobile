import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { InAppNotification } from '@/api/endpoints/notifications';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import {
  categoryIcon,
  categoryOf,
  groupByDay,
  timeLabel,
  unreadSummary,
  type NotificationCategory,
} from './notification-list';

/**
 * The in-app notification list.
 *
 * This is the reliable channel: push is a prompt to open the app, and someone
 * who declined that permission still sees everything here. Unread entries carry
 * a dot, a heavier title and the word "New" — never colour alone.
 */
export function NotificationsInboxScreen({
  notifications,
  unreadCount,
  now,
  loading = false,
  error = false,
  refreshing,
  loadingMore = false,
  hasMore = false,
  onRefresh,
  onRetry,
  onLoadMore,
  onOpen,
  onMarkAllRead,
  onOpenSettings,
}: {
  notifications: InAppNotification[];
  unreadCount: number;
  now: Date;
  loading?: boolean;
  error?: boolean;
  refreshing: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onRefresh: () => void;
  onRetry?: () => void;
  onLoadMore?: () => void;
  onOpen: (notification: InAppNotification) => void;
  onMarkAllRead: () => void;
  onOpenSettings?: () => void;
}) {
  const { colors } = useTheme();
  const groups = groupByDay(notifications, now);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* The navigator draws the title; this line is the state beneath it,
          which a title bar has no room for. */}
      <View style={styles.summaryRow}>
        <AppText style={{ color: colors.textMuted }}>
          {loading ? 'Loading…' : unreadSummary(unreadCount, notifications.length)}
        </AppText>
        {onOpenSettings ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
            onPress={onOpenSettings}
            hitSlop={10}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      {unreadCount > 0 ? (
        <AppButton
          label="Mark all as read"
          variant="outline"
          size="compact"
          onPress={onMarkAllRead}
          style={styles.markAll}
        />
      ) : null}

      {loading ? (
        <>
          <AppSkeletonCard testID="notifications-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {error && onRetry ? (
        <AppErrorState
          title="Could not load your notifications"
          description="Your updates could not be refreshed. Check your connection and try again."
          onRetry={onRetry}
        />
      ) : null}

      {!loading && !error && notifications.length === 0 ? (
        <AppEmptyState
          icon="notifications-outline"
          tone="positive"
          title="Nothing yet"
          description="Updates about your groups, savings and payments will appear here."
        />
      ) : null}

      {groups.map((group) => (
        <View key={group.label} style={styles.group}>
          <AppText
            accessibilityRole="header"
            weight="semibold"
            style={[styles.groupLabel, { color: colors.textMuted }]}
          >
            {group.label.toUpperCase()}
          </AppText>
          {group.items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onPress={() => onOpen(notification)}
            />
          ))}
        </View>
      ))}

      {hasMore && onLoadMore ? (
        <AppButton
          label={loadingMore ? 'Loading…' : 'Show older'}
          variant="ghost"
          onPress={onLoadMore}
          loading={loadingMore}
          disabled={loadingMore}
        />
      ) : null}
    </ScrollView>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: InAppNotification;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const unread = notification.readAt === null;
  const category = categoryOf(notification);
  const palette = categoryPalette(category, colors);
  const at = new Date(notification.createdAt);
  const time = Number.isNaN(at.getTime()) ? null : timeLabel(at);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.title ?? 'Notification'}${unread ? ', unread' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
    >
      <AppCard
        style={[
          styles.card,
          // A tinted ground as well as the dot: an unread row should be
          // findable while scrolling past, not only once it is read.
          unread ? { backgroundColor: colors.primarySoft, borderColor: colors.primary } : null,
        ]}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.icon, { backgroundColor: palette.soft }]}
        >
          <Ionicons name={categoryIcon(category)} size={18} color={palette.accent} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <AppText weight={unread ? 'bold' : 'medium'} style={styles.title}>
              {notification.title ?? 'Notification'}
            </AppText>
            {time ? (
              <AppText style={[styles.time, { color: colors.textMuted }]}>{time}</AppText>
            ) : null}
          </View>
          {notification.body ? (
            <AppText style={{ color: colors.textMuted }}>{notification.body}</AppText>
          ) : null}
          {unread ? (
            <View style={styles.unreadRow}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.dot, { backgroundColor: colors.primary }]}
              />
              {/* A word as well as a dot: status must never be carried by
                  colour or shape alone. */}
              <AppText weight="semibold" style={[styles.new, { color: colors.primary }]}>
                New
              </AppText>
            </View>
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

function categoryPalette(
  category: NotificationCategory,
  colors: ReturnType<typeof useTheme>['colors'],
): { accent: string; soft: string } {
  switch (category) {
    case 'ajo':
      return { accent: colors.primary, soft: colors.primarySoft };
    case 'akawo':
      return { accent: colors.secondary, soft: colors.secondarySoft };
    case 'food':
      return { accent: colors.warning, soft: colors.warningSoft };
    case 'bills':
      return { accent: colors.info, soft: colors.infoSoft };
    case 'payment':
      return { accent: colors.success, soft: colors.successSoft };
    case 'security':
      return { accent: colors.error, soft: colors.errorSoft };
    default:
      return { accent: colors.textMuted, soft: colors.surfaceMuted };
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  markAll: { alignSelf: 'flex-start' },

  group: { gap: spacing.sm },
  groupLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },

  card: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  body: { flex: 1, gap: 2 },
  titleRow: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm },
  title: { flex: 1 },
  time: { fontSize: fontSizes.caption },
  unreadRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  dot: { borderRadius: radius.pill, height: 8, width: 8 },
  new: { fontSize: fontSizes.caption },
});
