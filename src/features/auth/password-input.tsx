import { useState } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { spacing } from '@/theme';

export function PasswordInput(
  props: Omit<TextInputProps, 'secureTextEntry'> & { label: string; error?: string },
) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.container}>
      <AppInput {...props} secureTextEntry={!visible} textContentType="password" />
      <AppButton
        label={visible ? 'Hide password' : 'Show password'}
        variant="ghost"
        onPress={() => setVisible((value) => !value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: spacing.xs } });
