import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { listBillers } from '@/api/endpoints/bill-payments';
import { BillerListScreen } from '@/features/bills/biller-list-screen';

export default function BillersRoute() {
  // billerId and amountMinor arrive when a saved bill is being repeated, and
  // preselect the provider and amount the payer used last time.
  const { categoryId, categoryName, billerId, amountMinor } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    billerId?: string;
    amountMinor?: string;
  }>();

  const billers = useQuery({
    queryKey: ['bill-billers', categoryId],
    queryFn: () => listBillers(categoryId),
    enabled: Boolean(categoryId),
  });

  return (
    <BillerListScreen
      billers={billers.data}
      {...(categoryName ? { categoryName } : {})}
      {...(billerId ? { initialBillerId: billerId } : {})}
      {...(amountMinor ? { initialAmountMinor: amountMinor } : {})}
      loading={billers.isPending}
      error={billers.isError}
      onRetry={() => void billers.refetch()}
      onContinue={({ biller, product, customerReference, amountMinor: chosen }) =>
        // push: the payer can back out to change the provider or the amount.
        // The reference travels as a param because the next screen validates it
        // against the biller before anything is charged.
        router.push({
          pathname: '/(tabs)/bills/[categoryId]/pay',
          params: {
            categoryId,
            billerId: biller.id,
            customerReference,
            amountMinor: chosen,
            ...(product ? { productId: product.id } : {}),
            ...(categoryName ? { categoryName } : {}),
          },
        })
      }
    />
  );
}
