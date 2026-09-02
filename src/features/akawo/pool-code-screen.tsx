import { Share, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

/**
 * Shown once, immediately after a pool is created. The plaintext code exists
 * only in this response — the backend stores a digest — so this screen has to
 * make sharing it easy before the organiser navigates away.
 */
export function PoolCodeScreen({
  poolName,
  joinCode,
  amountMinor,
  currency,
  onDone,
}: {
  poolName: string;
  joinCode: string;
  amountMinor: string;
  currency: string;
  onDone: () => void;
}) {
  const { colors } = useTheme();

  const share = () => {
    void Share.share({
      message: `Join "${poolName}" on Ajo Cloud with code ${joinCode}.`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
          <Ionicons
            name="checkmark-circle"
            size={32}
            color={colors.success}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        <AppText accessibilityRole="header" weight="bold" style={styles.title}>
          {poolName} is ready
        </AppText>
        <AppText style={[styles.subtitle, { color: colors.textMuted }]}>
          Share this code with everyone who should pay.
        </AppText>

        <View
          accessible
          accessibilityLabel={`Join code ${joinCode.split('').join(' ')}`}
          style={[styles.codeBox, { backgroundColor: colors.primarySoft }]}
        >
          <AppText weight="bold" style={[styles.code, { color: colors.primary }]}>
            {joinCode}
          </AppText>
        </View>

        <AppText style={[styles.amount, { color: colors.textMuted }]}>
          Each member pays{' '}
          <AppAmount amountMinor={amountMinor} currency={currency} size="caption" />
        </AppText>

        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <AppText style={{ color: colors.text }}>
            This code is shown only once. Save or share it now — it cannot be retrieved later.
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppButton label="Share code" onPress={share} />
        <AppButton label="Done" variant="outline" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  content: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: { fontSize: fontSizes.title, textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  codeBox: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  code: { fontSize: 32, letterSpacing: 6 },
  amount: { textAlign: 'center' },
  notice: { borderRadius: radius.md, padding: spacing.md },
  footer: { gap: spacing.sm },
});
