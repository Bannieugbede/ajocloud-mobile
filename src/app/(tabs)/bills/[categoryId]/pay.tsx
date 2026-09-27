import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  listBillers,
  validateBillCustomer,
  type BillCustomerValidation,
} from '@/api/endpoints/bill-payments';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { billCategoryKind } from '@/features/bills/bill-catalog-view';
import { PayBillScreen } from '@/features/bills/pay-bill-screen';
import { usePayment } from '@/features/payments/use-payment';
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
  const payment = usePayment();
  const [validation, setValidation] = useState<BillCustomerValidation | null>(null);

  const billers = useQuery({
    queryKey: ['bill-billers', categoryId],
    queryFn: () => listBillers(categoryId),
    enabled: Boolean(categoryId),
  });

  const biller = billers.data?.find((candidate) => candidate.id === billerId) ?? null;
  const product = productId
    ? (biller?.products.find((candidate) => candidate.id === productId) ?? null)
    : null;

  const validate = useMutation({
    mutationFn: (reference: string) =>
      validateBillCustomer({
        billerId,
        ...(productId ? { productId } : {}),
        customerReference: reference,
      }),
    onSuccess: setValidation,
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

  const packageName = product && product.name !== 'Airtime top-up' ? ` ${product.name}` : '';

  return (
    <PayBillScreen
      kind={billCategoryKind(categoryName)}
      biller={biller}
      product={product}
      customerReference={customerReference}
      amountMinor={amountMinor}
      validation={validation}
      validating={validate.isPending}
      validationError={validate.error as AppError | null}
      onValidate={(reference) => validate.mutate(reference)}
      onPay={() => {
        if (!validation) return;
        // The shared payment flow takes it from here: the quote with any fee,
        // the wallet, a top-up if it is short, the PIN, and the result.
        payment.start({
          target: {
            kind: 'BILL_PAYMENT',
            validationId: validation.id,
            amountMinor,
            customerReference,
          },
          title: `${biller.name}${packageName}`,
          subtitle: `${biller.referenceLabel} ${validation.customerReferenceMasked}`,
          returnTo: '/(tabs)/bills',
        });
      }}
      // back: the form is still in the stack with what was typed.
      onEdit={() => router.back()}
    />
  );
}
