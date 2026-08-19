import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppInput } from '@/components/ui/app-input';
import { useTheme } from '@/hooks/use-theme';
import { sizes, spacing } from '@/theme';

export function PasswordInput(
  props: Omit<TextInputProps, 'secureTextEntry'> & {
    label: string;
    error?: string;
    /** Control rendered beside the label, e.g. a "Forgot password?" link. */
    labelAccessory?: ReactNode;
  },
) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <AppInput
      {...props}
      secureTextEntry={!visible}
      textContentType="password"
      icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textSubtle} />}
      action={
        <Pressable
          accessibilityRole="button"
          // State lives in the label because the icon alone conveys it visually.
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          accessibilityState={{ selected: visible }}
          hitSlop={spacing.sm}
          onPress={() => setVisible((value) => !value)}
          style={styles.toggle}
          testID="password-visibility-toggle"
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    alignItems: 'center',
    justifyContent: 'center',
    // Full-height target so the control still meets the 48dp minimum.
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
  },
});
