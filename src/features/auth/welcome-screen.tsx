import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

type WelcomeScreenProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
};

export function WelcomeScreen({
  onCreateAccount,
  onSignIn,
  onPrivacy,
  onTerms,
}: WelcomeScreenProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View
          accessible
          accessibilityLabel="Ajo Cloud, community savings"
          style={[styles.hero, { backgroundColor: colors.primary }]}
        >
          <View style={[styles.orbitLarge, { borderColor: colors.secondary }]} />
          <View style={[styles.orbitSmall, { borderColor: colors.textInverse }]} />
          <View style={[styles.logo, { backgroundColor: colors.surface }]}>
            <AppText weight="bold" style={[styles.logoText, { color: colors.primary }]}>
              A
            </AppText>
          </View>
          <AppText weight="bold" style={[styles.brand, { color: colors.textInverse }]}>
            Ajo Cloud
          </AppText>
          <AppText style={[styles.heroCaption, { color: colors.textInverse }]}>
            Save together. Grow together.
          </AppText>
        </View>

        <View style={styles.copy}>
          <AppText accessibilityRole="header" weight="bold" style={styles.heading}>
            Your savings community, now in the cloud.
          </AppText>
          <AppText style={[styles.body, { color: colors.textMuted }]}>
            Join Ajo contribution groups, save towards food packages, and build personal Akawo goals
            in one secure, community-driven app.
          </AppText>
          <View accessibilityLabel="Ajo Cloud benefits" style={styles.benefits}>
            {['Community savings', 'Food plans', 'Personal Akawo goals'].map((benefit) => (
              <View key={benefit} style={[styles.benefit, { backgroundColor: colors.primarySoft }]}>
                <AppText weight="medium" style={{ color: colors.primary }}>
                  {benefit}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton label="Create an account" onPress={onCreateAccount} />
          <AppButton label="Sign in" variant="outline" onPress={onSignIn} />
          <View style={styles.legalLinks}>
            <AppButton label="Terms of Service" variant="ghost" onPress={onTerms} />
            <AppButton label="Privacy Policy" variant="ghost" onPress={onPrivacy} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.lg },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.xl,
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    borderRadius: radius.lg,
    justifyContent: 'center',
    minHeight: 280,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  orbitLarge: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 230,
    opacity: 0.28,
    position: 'absolute',
    right: -60,
    top: -70,
    width: 230,
  },
  orbitSmall: {
    borderRadius: radius.pill,
    borderWidth: 2,
    bottom: -55,
    height: 150,
    left: -35,
    opacity: 0.18,
    position: 'absolute',
    width: 150,
  },
  logo: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 68,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 68,
  },
  logoText: { fontSize: 32 },
  brand: { fontSize: fontSizes.heading },
  heroCaption: { marginTop: spacing.xs, opacity: 0.9 },
  copy: { gap: spacing.md },
  heading: { fontSize: fontSizes.heading, lineHeight: 38 },
  body: { fontSize: fontSizes.body, lineHeight: 25 },
  benefits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benefit: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actions: { gap: spacing.md, marginTop: 'auto' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center' },
});
