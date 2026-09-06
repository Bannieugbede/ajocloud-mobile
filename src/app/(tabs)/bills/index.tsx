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
      // Not pre-sliced: the screen derives saved bills from the whole history,
      // and five payments to one biller would otherwise leave nothing to
      // derive from.
      {...(recent.data ? { recent: recent.data } : {})}
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
      // Opens the biller's own form with the amount prefilled. The reference is
      // masked in the history, so it cannot be carried over and is asked for
      // again — which also means a repeat cannot pay the wrong meter silently.
      onQuickPay={(bill) =>
        router.push({
          pathname: '/(tabs)/bills/[categoryId]',
          params: {
            categoryId: bill.categoryId,
            categoryName: bill.categoryName,
            billerId: bill.billerId,
            amountMinor: bill.amountMinor,
          },
        })
      }
    />
  );
}
