import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import type {
  BillBiller,
  BillCustomerValidation,
  BillProduct,
} from '@/api/endpoints/bill-payments';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount } from '@/utils/money';

import { amountError } from './bill-amount';
import type { BillCategoryKind } from './bill-catalog-view';
import { BillSection, ProviderBadge } from './bill-ui';

/**
 * The last look at a bill before it is paid.
 *
 * Everything was chosen on the previous screen, so this one only confirms it.
 * The number is checked with the provider as soon as the screen opens, and Pay
 * stays unavailable until the provider has recognised it: seeing the account
 * holder's name is how a mistyped meter or smartcard is caught. Changing
 * anything goes back to the form rather than editing here, because a
 * validation is bound to the exact number it was made for.
 *
 * Pay hands the bill to the shared payment flow, which shows the fee, checks
 * the wallet (offering a top-up if it is short) and asks for the PIN.
 */
export function PayBillScreen({
  kind,
  biller,
  product,
  customerReference,
  amountMinor,
  validation,
  validating,
  validationError,
  onValidate,
  onPay,
  onEdit,
}: {
  kind: BillCategoryKind | null;
  biller: BillBiller;
  product: BillProduct | null;
  customerReference: string;
  amountMinor: string;
  validation: BillCustomerValidation | null;
  validating: boolean;
  validationError?: AppError | null;
  onValidate: (customerReference: string) => void;
  onPay: () => void;
  onEdit: () => void;
}) {
  const { colors } = useTheme();

  const currency = product?.currency ?? 'NGN';
  const amountProblem = amountError(product, amountMinor);
  const amount = formatMinorAmount(amountMinor, currency);

  const requested = useRef(false);
  useEffect(() => {
    if (requested.current || validation) return;
    requested.current = true;
    onValidate(customerReference);
  }, [customerReference, onValidate, validation]);

  const ready = Boolean(validation) && !amountProblem;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <BillSection>
        <View style={styles.summary}>
          <ProviderBadge name={biller.name} kind={kind} size={56} />
          <AppText weight="semibold" style={styles.summaryTitle}>
            {product && product.name !== 'Airtime top-up'
              ? `${biller.name} · ${product.name}`
              : biller.name}
          </AppText>
          <AppText weight="bold" style={styles.amount}>
            {amount}
          </AppText>
          {product?.validity ? (
            <AppText style={{ color: colors.textMuted }}>Lasts {product.validity}</AppText>
          ) : null}
        </View>
      </BillSection>

      <BillSection title="Details">
        <Row label={biller.referenceLabel} value={customerReference} />
        <Row
          label="Account name"
          value={
            validation
              ? (validation.verifiedCustomerName ?? 'Confirmed')
              : validating
                ? null
                : validationError
                  ? 'Not recognised'
                  : null
          }
          loading={validating}
          tone={validationError && !validation ? 'error' : 'default'}
        />
        {product && product.name !== 'Airtime top-up' ? (
          <Row label={kind === 'electricity' ? 'Meter type' : 'Package'} value={product.name} />
        ) : null}
        <Row label="Amount" value={amount} />
      </BillSection>

      {validationError && !validation ? (
        <View style={styles.notice}>
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {validationError.message}
          </AppText>
          <AppButton
            label="Check again"
            variant="outline"
            onPress={() => onValidate(customerReference)}
            loading={validating}
          />
        </View>
      ) : null}

      {amountProblem ? <AppText style={{ color: colors.error }}>{amountProblem}</AppText> : null}

      <View style={styles.footer}>
        <AppButton label={`Pay ${amount}`} onPress={onPay} disabled={!ready} />
        <AppButton label="Change details" variant="outline" onPress={onEdit} />
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  loading = false,
  tone = 'default',
}: {
  label: string;
  value: string | null;
  loading?: boolean;
  tone?: 'default' | 'error';
}) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${loading ? 'checking' : (value ?? '')}`}
    >
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <AppText
          weight="semibold"
          style={[styles.rowValue, tone === 'error' ? { color: colors.error } : null]}
        >
          {value ?? '—'}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  summary: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  summaryTitle: { fontSize: fontSizes.body, textAlign: 'center' },
  amount: { fontSize: fontSizes.heading },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    minHeight: 28,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  notice: { gap: spacing.sm },
  footer: { gap: spacing.sm, marginTop: spacing.sm },
});
