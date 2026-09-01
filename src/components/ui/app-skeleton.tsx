import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

/**
 * A placeholder block for content that is still loading. The pulse is disabled
 * whenever the operating system reports "reduce motion", and the skeleton is
 * hidden from screen readers because the surrounding screen already announces
 * its loading state — an assistive user should hear that once, not per block.
 */
export function AppSkeleton({
  height = 16,
  width = '100%',
  style,
  testID,
}: {
  height?: number;
  width?: ViewStyle['width'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  // Lazy initial state creates the driver exactly once; `useRef().current` would
  // be read during render, which React 19 flags.
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled || reduceMotion) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.block,
        { backgroundColor: colors.surfaceMuted, height, width, opacity },
        style,
      ]}
      testID={testID}
    />
  );
}

/** The card-shaped skeleton product lists show while their first page loads. */
export function AppSkeletonCard({ testID }: { testID?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      testID={testID}
    >
      <AppSkeleton height={18} width="60%" />
      <AppSkeleton height={12} width="40%" />
      <AppSkeleton height={12} width="80%" />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: radius.sm },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
