import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { coreStepPosition, type RegistrationStep } from './steps';

/**
 * Shared layout for every account-creation step: heading, optional progress,
 * scrolling body, and a footer that stays reachable above the keyboard.
 */
export function StepScreen({
  step,
  title,
  description,
  error,
  footer,
  children,
}: PropsWithChildren<{
  step: RegistrationStep;
  title: string;
  description: string;
  error?: string;
  footer?: ReactNode;
}>) {
  const { colors } = useTheme();
  const position = coreStepPosition(step);

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
          {position ? <StepProgress index={position.index} total={position.total} /> : null}
          <View style={styles.heading}>
            <AppText accessibilityRole="header" weight="bold" style={styles.title}>
              {title}
            </AppText>
            <AppText style={[styles.description, { color: colors.textMuted }]}>
              {description}
            </AppText>
          </View>
          {error ? (
            <View
              accessibilityLiveRegion="assertive"
              style={[styles.alert, { backgroundColor: colors.errorSoft }]}
            >
              <AppText style={{ color: colors.error }}>{error}</AppText>
            </View>
          ) : null}
          {children}
          {footer}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Progress is announced as text as well as drawn, so the position is available
 * to a screen reader rather than being carried by the bars alone.
 */
function StepProgress({ index, total }: { index: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.progressGroup}>
      <AppText
        accessibilityLabel={`Step ${index} of ${total}`}
        style={[styles.progressLabel, { color: colors.textSubtle }]}
      >
        Step {index} of {total}
      </AppText>
      <View accessibilityElementsHidden importantForAccessibility="no" style={styles.progressBars}>
        {Array.from({ length: total }, (_, position) => (
          <View
            key={position}
            style={[
              styles.progressBar,
              { backgroundColor: position < index ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg },
  content: { alignSelf: 'center', gap: spacing.lg, maxWidth: sizes.contentMaxWidth, width: '100%' },
  progressGroup: { gap: spacing.sm },
  progressLabel: { fontSize: fontSizes.caption },
  progressBars: { flexDirection: 'row', gap: spacing.xs },
  progressBar: { borderRadius: radius.pill, flex: 1, height: 4 },
  heading: { gap: spacing.sm },
  title: { fontSize: fontSizes.heading },
  description: { lineHeight: 24 },
  alert: { borderRadius: radius.md, padding: spacing.md },
});
