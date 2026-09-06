import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius } from '@/theme';

/**
 * The large tinted glyph that heads a result or an intro screen.
 *
 * Six screens had their own — a receipt's outcome mark, a created pool's tick,
 * a join screen's icon — at three different sizes and two different corner
 * radii. It is decorative in every case: the heading beneath always says what
 * happened, so the glyph stays out of the accessibility tree rather than being
 * announced as a second, wordless element.
 */

export type MedallionTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export function AppMedallion({
  icon,
  tone = 'primary',
  size = 64,
  shape = 'circle',
  style,
  testID,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone?: MedallionTone;
  size?: number;
  /** `rounded` for an intro screen's square mark; `circle` for an outcome. */
  shape?: 'circle' | 'rounded';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const palette = {
    primary: { background: colors.primarySoft, tint: colors.primary },
    success: { background: colors.successSoft, tint: colors.success },
    warning: { background: colors.warningSoft, tint: colors.warning },
    error: { background: colors.errorSoft, tint: colors.error },
    neutral: { background: colors.surfaceMuted, tint: colors.textMuted },
  }[tone];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.medallion,
        {
          backgroundColor: palette.background,
          borderRadius: shape === 'circle' ? size / 2 : Math.round(size * 0.28),
          height: size,
          width: size,
        },
        style,
      ]}
      testID={testID}
    >
      <Ionicons name={icon} size={Math.round(size / 2)} color={palette.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  medallion: { alignItems: 'center', borderRadius: radius.pill, justifyContent: 'center' },
});
