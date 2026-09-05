import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';

import { AppText } from './app-text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * `compact` is for buttons that sit beside text rather than under it — the Join
 * and Create pair in a screen header, where two full-size buttons crowd the
 * title they belong to.
 *
 * It shrinks the drawn box, not the touch target: `hitSlop` puts back the
 * height the padding gives up, so the tappable area stays at 48dp.
 */
type ButtonSize = 'default' | 'compact';

type AppButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

/** Restores a compact button's touch target to the full 48dp. */
const COMPACT_HIT_SLOP = { bottom: 7, left: 4, right: 4, top: 7 };

export function AppButton({
  label,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const { colors } = useTheme();
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.secondary
        : variant === 'danger'
          ? colors.error
          : 'transparent';
  const foreground = ['primary', 'secondary', 'danger'].includes(variant)
    ? colors.textInverse
    : colors.text;

  const compact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      hitSlop={compact ? COMPACT_HIT_SLOP : undefined}
      {...props}
      style={(state) => [
        styles.button,
        compact ? styles.compact : null,
        {
          backgroundColor: background,
          borderColor: variant === 'outline' ? colors.borderStrong : background,
          opacity: disabled ? 0.55 : state.pressed ? 0.82 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <AppText
          numberOfLines={1}
          style={[
            { color: foreground, fontFamily: fontFamilies.semibold },
            compact ? styles.compactLabel : null,
          ]}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
  },
  compact: { borderRadius: radius.pill, minHeight: 34, paddingHorizontal: spacing.md },
  compactLabel: { fontSize: fontSizes.caption },
});
