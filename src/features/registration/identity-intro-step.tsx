import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';
import { StepScreen } from './step-screen';

const REQUIREMENTS = [
  {
    icon: 'person-outline',
    title: 'Personal details',
    detail: 'Date of birth, gender, address and occupation.',
  },
  {
    icon: 'card-outline',
    title: 'BVN or NIN',
    detail: 'Either one is enough. We only keep the last 4 digits.',
  },
  {
    icon: 'business-outline',
    title: 'Bank account',
    detail: 'Your bank and account number, so payouts reach you.',
  },
] as const;

/**
 * Explains the identity checks before asking for anything, so the user can
 * judge whether to start now. Verification is optional at sign-up: skipping
 * leads straight to the app, and it can be completed later from Profile.
 */
export function IdentityIntroStep({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const { colors } = useTheme();

  return (
    <StepScreen
      step="identity-intro"
      title="Verify your identity"
      description="Nigerian regulations require this before you can send, receive or withdraw money. It takes about 3 minutes, and you can do it later instead."
      footer={<AppButton label="I'll do this later" variant="ghost" onPress={onSkip} />}
    >
      <View style={styles.list}>
        {REQUIREMENTS.map((item) => (
          <View
            key={item.title}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons
                accessibilityElementsHidden
                importantForAccessibility="no"
                name={item.icon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.copy}>
              <AppText weight="semibold">{item.title}</AppText>
              <AppText style={[styles.detail, { color: colors.textMuted }]}>{item.detail}</AppText>
            </View>
          </View>
        ))}
        <AppButton label="Start verification" onPress={onStart} />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, gap: spacing.xs },
  detail: { lineHeight: 20 },
});
