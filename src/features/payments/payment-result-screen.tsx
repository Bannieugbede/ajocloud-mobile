import * as Clipboard from 'expo-clipboard';
import { ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { PaymentIntent } from '@/api/endpoints/payments';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';

/**
 * The outcome of a payment. `PROCESSING` is a first-class state rather than a
 * spinner: a bank transfer can take minutes, and telling someone their payment
 * failed because it has not landed yet would be wrong.
 */
export function PaymentResultScreen({
  intent,
  title,
  onDone,
  onRetry,
}: {
  intent: PaymentIntent;
  title: string;
  onDone: () => void;
  onRetry: () => void;
}) {
  const { colors } = useTheme();

  const presentation = {
    SUCCEEDED: {
      icon: 'checkmark-circle' as const,
      tint: colors.success,
      soft: colors.successSoft,
      heading: 'Payment complete',
      body: `Your payment for ${title} has been received.`,
    },
    PROCESSING: {
      icon: 'time-outline' as const,
      tint: colors.warning,
      soft: colors.warningSoft,
      heading: 'Waiting for your payment',
      body: 'We will confirm this as soon as the money arrives. You can safely leave this screen.',
    },
    FAILED: {
      icon: 'close-circle' as const,
      tint: colors.error,
      soft: colors.errorSoft,
      heading: 'Payment failed',
      body: intent.failureReason ?? 'Nothing was charged. You can try again.',
    },
    REQUIRES_METHOD: {
      icon: 'help-circle-outline' as const,
      tint: colors.textMuted,
      soft: colors.surfaceMuted,
      heading: 'Payment not started',
      body: 'This payment was not completed. Nothing was charged.',
    },
  }[intent.status];

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: presentation.soft }]}>
          <Ionicons
            name={presentation.icon}
            size={36}
            color={presentation.tint}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <AppText accessibilityRole="header" weight="bold" style={styles.heading}>
          {presentation.heading}
        </AppText>
        <AppAmount amountMinor={intent.totalMinor} currency={intent.currency} size="title" />
        <AppText
          accessibilityLiveRegion="polite"
          style={[styles.body, { color: colors.textMuted }]}
        >
          {presentation.body}
        </AppText>
      </View>

      {/* A transfer needs the account details to remain visible until it lands. */}
      {intent.transferInstructions ? (
        <AppCard>
          <AppText weight="semibold">Send exactly this amount to</AppText>
          <AppText weight="bold" style={styles.account}>
            {intent.transferInstructions.accountNumber}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            {intent.transferInstructions.bankName} · {intent.transferInstructions.accountName}
          </AppText>
          <AppButton
            label="Copy account number"
            variant="outline"
            onPress={() => {
              void Clipboard.setStringAsync(intent.transferInstructions?.accountNumber ?? '');
            }}
          />
        </AppCard>
      ) : null}

      <View style={styles.footer}>
        {intent.status === 'FAILED' ? <AppButton label="Try again" onPress={onRetry} /> : null}
        <AppButton
          label="Done"
          variant={intent.status === 'FAILED' ? 'outline' : 'primary'}
          onPress={onDone}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  heading: { fontSize: fontSizes.title, textAlign: 'center' },
  body: { textAlign: 'center' },
  account: { fontSize: fontSizes.title, letterSpacing: 2 },
  footer: { gap: spacing.sm },
});
