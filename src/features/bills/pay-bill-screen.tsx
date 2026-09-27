import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import type {
  BillBiller,
  BillCustomerValidation,
  BillProduct,
} from '@/api/endpoints/bill-payments';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useErrorToast } from '@/hooks/use-toast-on-change';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount, minorToMajor } from '@/utils/money';
import { amountError, canAfford, isFixedAmount, resolveAmountMinor } from './bill-amount';
import {
  normaliseReference,
  referenceKeyboard,
  referencePlaceholder,
  referenceProblem,
} from './bill-reference';

/**
 * Paying a bill, in the order the backend requires.
 *
 * The reference is checked with the provider first, and only then is the amount
 * asked for: a payment quotes a validation that is bound to the exact reference
 * and expires after fifteen minutes, so validating last would routinely produce
 * a stale pair. Confirming the account name before any money moves is also the
 * point at which a mistyped meter number is caught.
 */
export function PayBillScreen({
  biller,
  product,
  initialReference = '',
  initialAmountMinor,
  validation,
  walletAvailableMinor,
  validating,
  paying,
  validationError,
  payError,
  onValidate,
  onChangeReference,
  onPay,
}: {
  biller: BillBiller;
  product: BillProduct | null;
  /** Carried from the biller screen, where both were already chosen. */
  initialReference?: string;
  initialAmountMinor?: string;
  validation: BillCustomerValidation | null;
  walletAvailableMinor: string | null;
  validating: boolean;
  paying: boolean;
  validationError?: AppError | null;
  payError?: AppError | null;
  onValidate: (customerReference: string) => void;
  /** Clears a validation that no longer matches what is typed. */
  onChangeReference: () => void;
  onPay: (input: { customerReference: string; amountMinor: string }) => void;
}) {
  const { colors } = useTheme();
  useErrorToast(validationError?.message);
  useErrorToast(payError?.message);
  const [reference, setReference] = useState(initialReference);
  const [amountMajor, setAmountMajor] = useState(
    initialAmountMinor ? minorToMajor(initialAmountMinor) : '',
  );
  const [touched, setTouched] = useState(false);

  const kind = biller.referenceKind;
  const fixed = isFixedAmount(product);
  const amountMinor = resolveAmountMinor(product, amountMajor);
  const amountProblem = amountError(product, amountMinor);
  const affordable = canAfford(walletAvailableMinor, amountMinor);
  const referenceIssue = referenceProblem(kind, reference);

  // A number carried from the previous step was already typed and checked for
  // shape there, so it is confirmed with the provider straight away rather
  // than making the payer tap a second button to see whose meter it is.
  const autoValidated = useRef(false);
  useEffect(() => {
    if (autoValidated.current || validation || !initialReference) return;
    if (referenceProblem(kind, initialReference)) return;
    autoValidated.current = true;
    onValidate(normaliseReference(kind, initialReference));
  }, [initialReference, kind, onValidate, validation]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <AppText weight="semibold" style={styles.title}>
          {product ? `${biller.name} · ${product.name}` : biller.name}
        </AppText>
        {product?.validity ? (
          <AppText style={{ color: colors.textMuted }}>Lasts {product.validity}</AppText>
        ) : null}

        <AppInput
          label={biller.referenceLabel}
          value={reference}
          onChangeText={(value) => {
            setReference(value);
            // Editing invalidates the confirmation: the backend binds a
            // validation to the exact reference and would refuse the pair.
            if (validation) onChangeReference();
          }}
          keyboardType={referenceKeyboard(kind)}
          placeholder={referencePlaceholder(kind)}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!paying}
          error={reference.trim() && referenceIssue ? referenceIssue : undefined}
        />

        {validation ? (
          <AppCard>
            <AppText style={{ color: colors.textMuted }}>Paying</AppText>
            <AppText weight="semibold">
              {validation.verifiedCustomerName ?? validation.customerReferenceMasked}
            </AppText>
            <AppText style={{ color: colors.textMuted }}>
              {validation.customerReferenceMasked}
            </AppText>
          </AppCard>
        ) : (
          <AppButton
            label="Check this number"
            onPress={() => onValidate(normaliseReference(kind, reference))}
            loading={validating}
            disabled={Boolean(referenceIssue) || validating}
          />
        )}

        {validation ? (
          <>
            {fixed && product?.fixedAmountMinor ? (
              <AppCard>
                <AppText style={{ color: colors.textMuted }}>Amount</AppText>
                <AppText weight="bold" style={styles.amount}>
                  {formatMinorAmount(product.fixedAmountMinor, product.currency)}
                </AppText>
                <AppText style={{ color: colors.textMuted }}>
                  This one is a fixed amount set by {biller.name}.
                </AppText>
              </AppCard>
            ) : (
              <AppInput
                label="Amount"
                value={amountMajor}
                onChangeText={setAmountMajor}
                placeholder="1000"
                keyboardType="decimal-pad"
                editable={!paying}
                error={touched && amountProblem ? amountProblem : undefined}
              />
            )}

            {!affordable ? (
              <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
                Your wallet has{' '}
                {formatMinorAmount(walletAvailableMinor ?? '0', product?.currency ?? 'NGN')}{' '}
                available, which is not enough for this.
              </AppText>
            ) : null}

            <View style={styles.footer}>
              <AppButton
                label="Pay bill"
                onPress={() => {
                  if (amountProblem || !amountMinor) {
                    setTouched(true);
                    return;
                  }
                  onPay({ customerReference: normaliseReference(kind, reference), amountMinor });
                }}
                loading={paying}
                disabled={paying || !affordable}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: fontSizes.title },
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
  footer: { marginTop: spacing.sm },
  title: { fontSize: fontSizes.title },
});
