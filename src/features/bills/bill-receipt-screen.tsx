import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { BillPayment } from '@/api/endpoints/bill-payments';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppDivider } from '@/components/ui/app-divider';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { billOutcome } from './bill-amount';

type Presentation = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  soft: string;
  heading: string;
  body: string;
};

export function BillReceiptScreen({
  payment,
  onDone,
  onRetry,
}: {
  payment: BillPayment;
  onDone: () => void;
  onRetry: () => void;
}) {
  const { colors } = useTheme();
  const outcome = billOutcome(payment.status);

  const presentation = (
    {
      succeeded: {
        icon: 'checkmark-circle' as const,
        tint: colors.success,
        soft: colors.successSoft,
        heading: 'Payment complete',
        body: `Your payment to ${payment.customerReferenceMasked} went through.`,
      },
      pending: {
        icon: 'time-outline' as const,
        tint: colors.warning,
        soft: colors.warningSoft,
        heading: 'Payment in progress',
        body: 'We will confirm this as soon as the biller responds. You can safely leave this screen.',
      },
      failed: {
        icon: 'close-circle' as const,
        tint: colors.error,
        soft: colors.errorSoft,
        heading: 'Payment failed',
        body: payment.failureReason ?? 'Your wallet was not charged. You can try again.',
      },
      unresolved: {
        icon: 'help-circle' as const,
        tint: colors.warning,
        soft: colors.warningSoft,
        heading: 'We are checking this payment',
        // Deliberately does not claim either outcome: the wallet was debited
        // and the provider's result is not yet known.
        heading2: '',
        body: 'Your wallet was charged and we are confirming the result with the biller. Support can see this payment if you need help.',
      },
    } satisfies Record<ReturnType<typeof billOutcome>, Presentation & { heading2?: string }>
  )[outcome];

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: presentation.soft }]}>
          <Ionicons
            name={presentation.icon}
            size={32}
            color={presentation.tint}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <AppText accessibilityRole="header" weight="bold" style={styles.heading}>
          {presentation.heading}
        </AppText>
        <AppText style={[styles.body, { color: colors.textMuted }]}>{presentation.body}</AppText>
      </View>

      <AppCard>
        <Row label="Amount" value={formatMinorAmount(payment.amountMinor, payment.currency)} />
        {/* Shown even at zero, so a fee that starts being charged is not a
            surprise the payer has to work out from their balance. */}
        <Row label="Fee" value={formatMinorAmount(payment.feeMinor, payment.currency)} />
        <AppDivider />
        <Row
          label="Total charged"
          value={formatMinorAmount(payment.totalDebitMinor, payment.currency)}
          emphasis
        />
        <AppDivider />
        <Row label="Paid to" value={payment.customerReferenceMasked} />
        {payment.verifiedCustomerName ? (
          <Row label="Name" value={payment.verifiedCustomerName} />
        ) : null}
        <Row label="Reference" value={payment.internalReference} />
        {payment.receipt ? <Row label="Receipt" value={payment.receipt.receiptNumber} /> : null}
      </AppCard>

      <View style={styles.actions}>
        {outcome === 'failed' ? <AppButton label="Try again" onPress={onRetry} /> : null}
        <AppButton
          label="Done"
          variant={outcome === 'failed' ? 'outline' : 'primary'}
          onPress={onDone}
        />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight={emphasis ? 'bold' : 'regular'} style={styles.value} selectable>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  body: { textAlign: 'center' },
  container: { gap: spacing.lg, padding: spacing.lg },
  header: { alignItems: 'center', gap: spacing.sm },
  heading: { fontSize: fontSizes.title, textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  value: { flexShrink: 1, textAlign: 'right' },
});
