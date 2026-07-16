import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

export function ProductTabPlaceholder({
  title,
  description,
  sections,
  icon,
}: {
  title: string;
  description: string;
  sections: string[];
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.hero, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} color={colors.primary} size={32} />
        <AppText accessibilityRole="header" weight="bold" style={styles.title}>
          {title}
        </AppText>
        <AppText style={{ color: colors.textMuted }}>{description}</AppText>
      </View>
      <View style={styles.list}>
        {sections.map((section) => (
          <View
            key={section}
            style={[
              styles.card,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <AppText weight="semibold">{section}</AppText>
            <AppText style={{ color: colors.textMuted }}>
              This section will use live backend data when its roadmap contract is implemented.
            </AppText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  title: { fontSize: fontSizes.heading },
  list: { gap: spacing.md },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
});
