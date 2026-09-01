import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type CardTone = 'default' | 'muted' | 'elevated';

type AppCardProps = {
  children: React.ReactNode;
  tone?: CardTone;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Supplying `onPress` turns the card into a single button-shaped target. */
  onPress?: () => void;
  /** Accessible name for the pressable form. Required whenever `onPress` is set. */
  accessibilityLabel?: string;
};

/**
 * The bordered container every product list and detail screen repeats. A card is
 * a plain `View` until it is given `onPress`, at which point the whole surface
 * becomes one button rather than leaving the tap target on an inner row.
 */
export function AppCard({
  children,
  tone = 'default',
  style,
  testID,
  onPress,
  accessibilityLabel,
}: AppCardProps) {
  const { colors } = useTheme();
  const background =
    tone === 'muted'
      ? colors.surfaceMuted
      : tone === 'elevated'
        ? colors.surfaceElevated
        : colors.cardBackground;
  const surface = [styles.card, { backgroundColor: background, borderColor: colors.border }, style];

  if (!onPress) {
    return (
      <View style={surface} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={(state) => [...surface, state.pressed && { opacity: 0.82 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
