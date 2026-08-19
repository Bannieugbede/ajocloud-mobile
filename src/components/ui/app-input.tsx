import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';
import { AppText } from './app-text';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
  /** Decorative leading icon. Kept out of the accessibility tree. */
  icon?: ReactNode;
  /** Interactive trailing control, e.g. a reveal-password toggle. */
  action?: ReactNode;
  /** Control shown on the label row, e.g. a "Forgot password?" link. */
  labelAccessory?: ReactNode;
};

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, error, icon, action, labelAccessory, style, ...props },
  ref,
) {
  const { colors } = useTheme();
  const errorId = error ? `${props.testID ?? label}-error` : undefined;
  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <AppText weight="semibold" style={styles.label}>
          {label}
        </AppText>
        {labelAccessory}
      </View>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
          },
        ]}
      >
        {icon ? (
          <View accessibilityElementsHidden importantForAccessibility="no" style={styles.adornment}>
            {icon}
          </View>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error}
          accessibilityState={{ disabled: props.editable === false }}
          aria-describedby={errorId}
          placeholderTextColor={colors.placeholder}
          {...props}
          style={[styles.input, { color: colors.text, fontFamily: fontFamilies.regular }, style]}
        />
        {action}
      </View>
      {error ? (
        <AppText
          nativeID={errorId}
          accessibilityLiveRegion="polite"
          style={[styles.error, { color: colors.error }]}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { fontSize: fontSizes.caption },
  field: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
  },
  adornment: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
  },
  error: { fontSize: fontSizes.caption },
});
