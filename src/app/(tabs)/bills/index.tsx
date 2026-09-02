import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { listBillCategories, listBillPayments } from '@/api/endpoints/bill-payments';
import { BillsHomeScreen } from '@/features/bills/bills-home-screen';

export default function BillsRoute() {
  const categories = useQuery({
    queryKey: ['bill-categories'],
    queryFn: listBillCategories,
  });

  // Recent payments share this screen so a receipt can be reopened without
  // hunting for it; a failure here must not hide the categories.
  const recent = useQuery({ queryKey: ['bill-payments'], queryFn: listBillPayments });

  return (
    <BillsHomeScreen
      categories={categories.data}
      {...(recent.data ? { recent: recent.data.slice(0, 5) } : {})}
      loading={categories.isPending}
      error={categories.isError}
      onRetry={() => {
        void categories.refetch();
        void recent.refetch();
      }}
      // push: choosing a category is a reversible step from the list.
      onOpenCategory={(category) =>
        router.push({
          pathname: '/(tabs)/bills/[categoryId]',
          params: { categoryId: category.id, categoryName: category.name },
        })
      }
      onOpenPayment={(paymentId) =>
        router.push({ pathname: '/(tabs)/bills/receipt', params: { paymentId } })
      }
    />
  );
}
