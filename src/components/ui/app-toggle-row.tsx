import { StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A labelled on/off setting on its own card.
 *
 * The switch carries the title and description as its accessible name, so a
 * screen reader announces what is being turned on rather than just "switch".
 */
export function AppToggleRow({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
  testID,
}: {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID={testID}
    >
      <View style={styles.text}>
        <AppText weight="semibold">{title}</AppText>
        {description ? (
          <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={description ? `${title}. ${description}` : title}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
    padding: spacing.md,
  },
  text: { flex: 1, gap: 2 },
  description: { fontSize: fontSizes.caption },
});
