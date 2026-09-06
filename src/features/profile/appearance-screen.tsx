import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing, type ThemePreference } from '@/theme';

const OPTIONS: readonly {
  value: ThemePreference;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    value: 'system',
    label: 'System',
    description: 'Follow your phone’s setting',
    icon: 'phone-portrait-outline',
  },
  { value: 'light', label: 'Light', description: 'Always light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', description: 'Always dark', icon: 'moon-outline' },
];

/**
 * The three-way appearance choice, on its own screen.
 *
 * A switch would only offer light and dark, which loses "System" — the default,
 * and the one most people want because it follows the phone at dusk without
 * being asked. Given the design puts a chevron here, the full choice lives
 * behind it rather than being reduced to fit.
 */
export function AppearanceScreen({
  preference,
  onChange,
}: {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View accessibilityRole="radiogroup" style={styles.group}>
        {OPTIONS.map((option) => {
          const selected = option.value === preference;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label}. ${option.description}`}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                  // Two pixels rather than one on the chosen row, so selection
                  // survives being read without colour.
                  borderWidth: selected ? 2 : 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={[styles.icon, { backgroundColor: colors.primarySoft }]}
              >
                <Ionicons name={option.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.text}>
                <AppText weight="semibold">{option.label}</AppText>
                <AppText style={[styles.description, { color: colors.textMuted }]}>
                  {option.description}
                </AppText>
              </View>
              {selected ? (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <AppText style={[styles.footnote, { color: colors.textMuted }]}>
        Your choice is remembered on this device.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  group: { gap: spacing.sm },
  row: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
    padding: spacing.md,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  text: { flex: 1, gap: 2 },
  description: { fontSize: fontSizes.caption },
  footnote: { fontSize: fontSizes.caption },
});
