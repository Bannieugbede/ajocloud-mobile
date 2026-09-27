import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  createBillPayment,
  listBillers,
  validateBillCustomer,
  type BillCustomerValidation,
} from '@/api/endpoints/bill-payments';
import { getWalletSummary, listWallets } from '@/api/endpoints/wallets';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { billCategoryKind } from '@/features/bills/bill-catalog-view';
import { PayBillScreen } from '@/features/bills/pay-bill-screen';
import type { AppError } from '@/types/errors';

export default function PayBillRoute() {
  const { categoryId, categoryName, billerId, productId, customerReference, amountMinor } =
    useLocalSearchParams<{
      categoryId: string;
      categoryName?: string;
      billerId: string;
      productId?: string;
      customerReference?: string;
      amountMinor?: string;
    }>();
  const queryClient = useQueryClient();

  // One key per mounted flow, so a retried tap reuses the same payment rather
  // than charging twice. Generated in a lazy initialiser because calling
  // Date.now or Math.random during render is impure.
  const [idempotencyKey] = useState(
    () => `bill-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [validation, setValidation] = useState<BillCustomerValidation | null>(null);

  const billers = useQuery({
    queryKey: ['bill-billers', categoryId],
    queryFn: () => listBillers(categoryId),
    enabled: Boolean(categoryId),
  });
  // A bill payment names the wallet it debits, and the shared balance endpoint
  // does not return an id, so the wallet is listed and then summarised.
  const wallets = useQuery({ queryKey: ['wallets'], queryFn: listWallets });
  const walletId = wallets.data?.find((candidate) => candidate.status === 'ACTIVE')?.id ?? null;
  const summary = useQuery({
    queryKey: ['wallet-summary', walletId],
    queryFn: () => getWalletSummary(walletId as string),
    enabled: Boolean(walletId),
  });

  const biller = billers.data?.find((candidate) => candidate.id === billerId) ?? null;
  const product = productId
    ? (biller?.products.find((candidate) => candidate.id === productId) ?? null)
    : null;

  const validate = useMutation({
    mutationFn: (customerReference: string) =>
      validateBillCustomer({
        billerId,
        ...(productId ? { productId } : {}),
        customerReference,
      }),
    onSuccess: setValidation,
  });

  const pay = useMutation({
    mutationFn: (input: { customerReference: string; amountMinor: string }) => {
      if (!validation) throw new Error('This number has not been checked yet');
      if (!walletId) throw new Error('No wallet is available for this payment');
      return createBillPayment(
        {
          walletId,
          validationId: validation.id,
          customerReference: input.customerReference,
          amountMinor: input.amountMinor,
        },
        idempotencyKey,
      );
    },
    onSuccess: (payment) => {
      void queryClient.invalidateQueries({ queryKey: ['bill-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-summary', walletId] });
      // replace: the payment exists now, so backing into the form would offer
      // to charge for it again.
      router.replace({ pathname: '/(tabs)/bills/receipt', params: { paymentId: payment.id } });
    },
  });

  if (billers.isPending) return <AppLoadingState label="Loading biller" />;
  if (billers.isError || !biller || !customerReference || !amountMinor) {
    return (
      <AppErrorState
        description="Could not load this biller."
        onRetry={() => void billers.refetch()}
      />
    );
  }

  return (
    <PayBillScreen
      kind={billCategoryKind(categoryName)}
      biller={biller}
      product={product}
      customerReference={customerReference}
      amountMinor={amountMinor}
      validation={validation}
      walletAvailableMinor={summary.data?.availableMinor ?? null}
      validating={validate.isPending}
      paying={pay.isPending}
      validationError={validate.error as AppError | null}
      payError={pay.error as AppError | null}
      onValidate={(reference) => validate.mutate(reference)}
      onPay={(input) => pay.mutate(input)}
      // back: the form is still in the stack with what was typed.
      onEdit={() => router.back()}
    />
  );
}
