import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius, sizes } from '@/theme';

type IconButtonVariant = 'plain' | 'soft' | 'onInverse';

/**
 * An icon-only control. `label` is mandatory rather than optional: an icon alone
 * gives a screen reader nothing to announce, so the type system enforces the
 * accessible name that the glyph cannot provide.
 */
export function AppIconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  size = 22,
  disabled,
  style,
  testID,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const foreground =
    variant === 'onInverse'
      ? colors.textInverse
      : variant === 'soft'
        ? colors.primary
        : colors.text;
  const background =
    variant === 'soft'
      ? colors.primarySoft
      : variant === 'onInverse'
        ? 'rgba(255,255,255,0.16)'
        : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={(state) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.5 : state.pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
  },
});
