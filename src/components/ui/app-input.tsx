import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, fontSizes, radius, sizes, spacing } from '@/theme';
import { AppText } from './app-text';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, error, style, ...props },
  ref,
) {
  const { colors } = useTheme();
  const errorId = error ? `${props.testID ?? label}-error` : undefined;
  return (
    <View style={styles.group}>
      <AppText weight="semibold" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error}
        accessibilityState={{ disabled: props.editable === false }}
        aria-describedby={errorId}
        placeholderTextColor={colors.placeholder}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
            color: colors.text,
            fontFamily: fontFamilies.regular,
          },
          style,
        ]}
      />
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
  label: { fontSize: fontSizes.caption },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: fontSizes.body,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { fontSize: fontSizes.caption },
});
