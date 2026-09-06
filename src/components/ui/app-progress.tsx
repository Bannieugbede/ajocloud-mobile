import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A savings/contribution progress bar. Progress is supplied in basis points
 * because that is what the Akawo API returns, avoiding a lossy conversion at the
 * call site. The percentage is also rendered as text so the bar is never the only
 * way to read the value.
 */
export function AppProgress({
  progressBps,
  label,
  showValue = true,
  tone = 'secondary',
  style,
  testID,
}: {
  progressBps: number;
  /** Accessible name, e.g. the goal's title. */
  label: string;
  showValue?: boolean;
  /** `success` for a collection that is filling up, where green reads as money in. */
  tone?: 'secondary' | 'success';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const fill = tone === 'success' ? colors.success : colors.secondary;
  const clamped = Math.max(0, Math.min(10_000, Math.round(progressBps)));
  const percent = Math.round(clamped / 100);

  return (
    <View style={[styles.group, style]} testID={testID}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} percent` }}
        style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
      >
        <View style={[styles.fill, { backgroundColor: fill, width: `${percent}%` }]} />
      </View>
      {showValue ? (
        <AppText weight="medium" style={{ color: colors.textMuted }}>
          {percent}%
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  track: { borderRadius: radius.pill, flex: 1, height: 8, overflow: 'hidden' },
  fill: { borderRadius: radius.pill, height: '100%' },
});
