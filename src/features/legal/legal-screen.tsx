import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

export type LegalDocument = 'privacy' | 'terms';

const documents = {
  terms: {
    title: 'Terms of Service',
    summary:
      'The approved Terms of Service are not bundled in this development build. Ajo Cloud will display the release-approved document here before production distribution.',
  },
  privacy: {
    title: 'Privacy Policy',
    summary:
      'The approved Privacy Policy is not bundled in this development build. Ajo Cloud will display the release-approved document here before production distribution.',
  },
} as const;

export function LegalScreen({ document }: { document: LegalDocument }) {
  const { colors } = useTheme();
  const content = documents[document];
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
      >
        <AppText accessibilityRole="header" weight="bold" style={styles.title}>
          {content.title}
        </AppText>
        <AppText style={{ color: colors.textMuted }}>{content.summary}</AppText>
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText weight="semibold" style={{ color: colors.text }}>
            Content unavailable
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            This explicit offline state prevents draft legal wording from being presented as
            approved policy.
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.lg, padding: spacing.lg },
  title: { fontSize: fontSizes.heading },
  notice: { borderRadius: radius.md, gap: spacing.sm, padding: spacing.md },
});
