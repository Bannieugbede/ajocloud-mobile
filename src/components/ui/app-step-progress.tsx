import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

/**
 * How far through a multi-step form the member is.
 *
 * One bar per step rather than a single filling bar, because the segments show
 * how many steps remain as well as how many are done — which is the question
 * someone part-way through a form is actually asking.
 *
 * Decorative: the screen states "Step 2 of 5" in text, so announcing the bars
 * as well would repeat it.
 */
export function AppStepProgress({
  total,
  current,
  testID,
}: {
  total: number;
  /** 1-based index of the step being shown. */
  current: number;
  testID?: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={styles.row}
      testID={testID}
    >
      {Array.from({ length: total }, (_unused, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            { backgroundColor: index < current ? colors.primary : colors.surfaceMuted },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  segment: { borderRadius: radius.pill, flex: 1, height: 5 },
});
