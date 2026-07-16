import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { useThemeStore } from '@/store/theme-store';
import { fontSizes, radius, sizes, spacing, type ThemePreference } from '@/theme';

export default function Index() {
  const { colors, mode, preference } = useTheme();
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppText weight="bold" style={styles.heading}>
          Ajo Cloud
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          The native Expo foundation is ready for screen-by-screen implementation.
        </AppText>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <AppText weight="semibold">Foundation checks</AppText>
          <Check label="Expo Router and native Stack header" />
          <Check label="Poppins 400, 500, 600, and 700 loaded" />
          <Check label="TanStack Query and network provider mounted" />
          <Check label={`Theme tokens active in ${mode} mode`} />
        </View>

        <View accessibilityRole="radiogroup" style={styles.section}>
          <AppText weight="semibold">Theme preference</AppText>
          <View style={styles.controls}>
            {(['system', 'light', 'dark'] as const).map((value) => (
              <ThemeOption
                key={value}
                selected={preference === value}
                value={value}
                onSelect={setPreference}
              />
            ))}
          </View>
        </View>

        <AppText style={{ color: colors.textSubtle, fontSize: fontSizes.caption }}>
          This setup screen is temporary and is not a product design.
        </AppText>
      </View>
    </ScrollView>
  );
}

function ThemeOption({
  value,
  selected,
  onSelect,
}: {
  value: ThemePreference;
  selected: boolean;
  onSelect: (value: ThemePreference) => void;
}) {
  const { colors } = useTheme();
  const label = value[0].toUpperCase() + value.slice(1);
  return (
    <Pressable
      accessibilityLabel={`${label} theme`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(value)}
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <AppText weight={selected ? 'semibold' : 'regular'}>{label}</AppText>
    </Pressable>
  );
}

function Check({ label }: { label: string }) {
  const { colors } = useTheme();
  return <AppText style={{ color: colors.textMuted }}>✓ {label}</AppText>;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
  heading: { fontSize: fontSizes.heading },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  section: { gap: spacing.md },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
  },
});
