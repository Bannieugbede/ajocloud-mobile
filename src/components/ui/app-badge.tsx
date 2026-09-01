import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

/**
 * A status pill. The label always carries the meaning, so the tone is a second
 * signal rather than the only one — a requirement for colour-blind users and for
 * screen readers, which never see the fill at all.
 */
export function AppBadge({
  label,
  tone = 'neutral',
  style,
  testID,
}: {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const palette: Record<BadgeTone, { background: string; foreground: string }> = {
    neutral: { background: colors.surfaceMuted, foreground: colors.textMuted },
    primary: { background: colors.primarySoft, foreground: colors.primary },
    success: { background: colors.successSoft, foreground: colors.success },
    warning: { background: colors.warningSoft, foreground: colors.warning },
    error: { background: colors.errorSoft, foreground: colors.error },
    info: { background: colors.infoSoft, foreground: colors.info },
  };
  const { background, foreground } = palette[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background }, style]} testID={testID}>
      <AppText weight="semibold" style={[styles.label, { color: foreground }]}>
        {label}
      </AppText>
    </View>
  );
}

/**
 * Maps the backend's SCREAMING_SNAKE domain statuses onto badge tones and a
 * human-readable label, so every screen presents the same status identically.
 */
export function statusTone(status: string): BadgeTone {
  const value = status.toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'APPROVED', 'PAID', 'SUCCESSFUL', 'VERIFIED'].includes(value))
    return 'success';
  if (['PENDING', 'PENDING_REVIEW', 'AWAITING_PAYMENT', 'PROCESSING', 'DRAFT'].includes(value))
    return 'warning';
  if (['FAILED', 'DEFAULTED', 'REJECTED', 'CANCELLED', 'SUSPENDED', 'OVERDUE'].includes(value))
    return 'error';
  if (['SCHEDULED', 'UPCOMING', 'OPEN'].includes(value)) return 'info';
  return 'neutral';
}

export function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: { fontSize: fontSizes.caption },
});
