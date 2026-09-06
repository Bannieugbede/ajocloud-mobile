import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

export type BadgeTone = 'success' | 'warning' | 'info' | 'neutral' | 'error';

/**
 * The small status pill that labels a card, a row, or a header.
 *
 * The label is always the tone's own words, never a colour alone, so the state
 * survives a greyscale screen and a screen reader.
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
  const palette = {
    success: { text: colors.success, background: colors.successSoft },
    warning: { text: colors.warning, background: colors.warningSoft },
    info: { text: colors.info, background: colors.infoSoft },
    error: { text: colors.error, background: colors.errorSoft },
    neutral: { text: colors.textMuted, background: colors.surfaceMuted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }, style]} testID={testID}>
      <AppText weight="semibold" style={[styles.text, { color: palette.text }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  text: { fontSize: fontSizes.caption },
});
