import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { StepScreen } from './step-screen';

/**
 * Step j. Only reached by finishing verification; someone who skipped step f
 * goes straight to the intent step and never sees this.
 */
export function IdentityCompleteStep({
  requiresReview,
  onContinue,
}: {
  /** Set when a name mismatch sent the profile to manual review. */
  requiresReview?: boolean;
  onContinue: () => void;
}) {
  const { colors } = useTheme();

  return (
    <StepScreen
      step="identity-complete"
      title={requiresReview ? "We're reviewing your details" : 'You’re verified'}
      description={
        requiresReview
          ? 'Your documents are with our team. This usually takes a few hours, and we’ll let you know as soon as it’s done. You can start using Ajo Cloud now.'
          : 'Your account is fully verified. You can now join groups, save towards goals, and withdraw to your bank.'
      }
    >
      <View style={styles.body}>
        <View
          style={[
            styles.badge,
            { backgroundColor: requiresReview ? colors.warningSoft : colors.successSoft },
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            importantForAccessibility="no"
            name={requiresReview ? 'time-outline' : 'shield-checkmark'}
            size={44}
            color={requiresReview ? colors.warning : colors.success}
          />
        </View>

        {!requiresReview ? (
          <View style={styles.list}>
            {[
              'Join and create Ajo groups',
              'Save towards Akawo goals',
              'Withdraw to your bank account',
            ].map((item) => (
              <View key={item} style={styles.row}>
                <Ionicons
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <AppText style={styles.rowLabel}>{item}</AppText>
              </View>
            ))}
          </View>
        ) : null}

        <AppButton label="Continue" onPress={onContinue} />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'stretch', gap: spacing.lg },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  list: { gap: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  rowLabel: { flex: 1, fontSize: fontSizes.body },
});
