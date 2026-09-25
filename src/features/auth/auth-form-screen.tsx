import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';

import { AppText } from '@/components/ui/app-text';
import { useErrorToast } from '@/hooks/use-toast-on-change';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, sizes, spacing } from '@/theme';

export function AuthFormScreen({
  title,
  description,
  error,
  children,
  footer,
}: PropsWithChildren<{
  title: string;
  description: string;
  error?: string;
  footer?: ReactNode;
}>) {
  const { colors } = useTheme();
  // Shown as a toast, like every other error, rather than a box in the form.
  useErrorToast(error);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.heading}>
            <AppText accessibilityRole="header" weight="bold" style={styles.title}>
              {title}
            </AppText>
            <AppText style={[styles.description, { color: colors.textMuted }]}>
              {description}
            </AppText>
          </View>
          {children}
          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg },
  content: { alignSelf: 'center', gap: spacing.lg, maxWidth: sizes.contentMaxWidth, width: '100%' },
  heading: { gap: spacing.sm },
  title: { fontSize: fontSizes.heading },
  description: { lineHeight: 24 },
});
