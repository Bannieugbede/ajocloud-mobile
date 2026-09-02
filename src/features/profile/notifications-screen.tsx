import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import type { NotificationChannel } from '@/api/endpoints/notification-preferences';

import { quietHoursLabel, type TopicRow } from './notification-settings';

/** Preset windows, so the common case needs no time picker. */
const QUIET_PRESETS = [
  { label: 'Off', window: null },
  { label: '22:00 to 07:00', window: { startMinutes: 22 * 60, endMinutes: 7 * 60 } },
  { label: '21:00 to 08:00', window: { startMinutes: 21 * 60, endMinutes: 8 * 60 } },
] as const;

/**
 * Which product messages this person wants, and when they may arrive.
 *
 * Security and account-recovery messages are absent by design: they cannot be
 * declined, and a switch that does nothing is worse than no switch. The note at
 * the foot of the screen says so plainly rather than leaving it to be inferred.
 */
export function NotificationsScreen({
  rows,
  quietWindow,
  timezone,
  saving,
  error,
  saved,
  onToggle,
  onQuietHours,
}: {
  rows: TopicRow[];
  quietWindow: { startMinutes: number; endMinutes: number } | null;
  timezone: string;
  saving: boolean;
  error?: AppError | null;
  saved: boolean;
  onToggle: (row: TopicRow, channel: NotificationChannel, enabled: boolean) => void;
  onQuietHours: (window: { startMinutes: number; endMinutes: number } | null) => void;
}) {
  const { colors } = useTheme();
  const current = quietHoursLabel(quietWindow);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AppText accessibilityRole="header" weight="semibold">
        What we tell you about
      </AppText>

      {rows.map((row) => (
        <AppCard key={row.topic}>
          <AppText weight="semibold">{row.title}</AppText>
          <AppText style={{ color: colors.textMuted }}>{row.description}</AppText>
          <View style={styles.channels}>
            <View style={styles.channel}>
              <AppText>Email</AppText>
              <Switch
                value={row.email}
                disabled={saving}
                onValueChange={(next) => onToggle(row, 'EMAIL', next)}
                accessibilityLabel={`${row.title} by email`}
              />
            </View>
            <View style={styles.channel}>
              <AppText>SMS</AppText>
              <Switch
                value={row.sms}
                disabled={saving}
                onValueChange={(next) => onToggle(row, 'SMS', next)}
                accessibilityLabel={`${row.title} by SMS`}
              />
            </View>
          </View>
        </AppCard>
      ))}

      <AppText accessibilityRole="header" weight="semibold">
        Quiet hours
      </AppText>
      <AppCard>
        <AppText style={{ color: colors.textMuted }}>
          Messages about the topics above are held during these hours, in {timezone} time. Currently{' '}
          {current}.
        </AppText>
        <View style={styles.presets}>
          {QUIET_PRESETS.map((preset) => (
            <AppButton
              key={preset.label}
              label={preset.label}
              variant={current === preset.label ? 'primary' : 'secondary'}
              disabled={saving}
              onPress={() => onQuietHours(preset.window)}
            />
          ))}
        </View>
      </AppCard>

      {error ? (
        <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
          {error.message}
        </AppText>
      ) : null}
      {saved && !error ? (
        <AppText style={{ color: colors.success }} accessibilityLiveRegion="polite">
          Your notification settings have been saved.
        </AppText>
      ) : null}

      <AppText style={{ color: colors.textMuted }}>
        Messages about your security — signing in, password changes and account locks — are always
        sent, so you cannot be locked out of your own account.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  channels: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  channel: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
});
