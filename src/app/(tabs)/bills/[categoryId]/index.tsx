import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { listBillers } from '@/api/endpoints/bill-payments';
import { BillerListScreen } from '@/features/bills/biller-list-screen';

export default function BillersRoute() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
  }>();

  const billers = useQuery({
    queryKey: ['bill-billers', categoryId],
    queryFn: () => listBillers(categoryId),
    enabled: Boolean(categoryId),
  });

  return (
    <BillerListScreen
      billers={billers.data}
      loading={billers.isPending}
      error={billers.isError}
      onRetry={() => void billers.refetch()}
      onSelect={(biller, product) =>
        // push: the payer can back out to pick a different product.
        router.push({
          pathname: '/(tabs)/bills/[categoryId]/pay',
          params: {
            categoryId,
            billerId: biller.id,
            ...(product ? { productId: product.id } : {}),
            ...(categoryName ? { categoryName } : {}),
          },
        })
      }
    />
  );
}
