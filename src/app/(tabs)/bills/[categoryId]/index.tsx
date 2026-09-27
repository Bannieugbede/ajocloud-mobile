import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { listBillers } from '@/api/endpoints/bill-payments';
import { AppErrorState } from '@/components/ui/app-state';
import { billCategoryKind } from '@/features/bills/bill-catalog-view';
import { BillCategoryScreen } from '@/features/bills/bill-forms';

export default function BillCategoryRoute() {
  // The chosen provider lives in the route rather than in screen state, so the
  // provider list can hand a choice back with dismissTo. amountMinor arrives
  // when a saved bill is repeated.
  const { categoryId, categoryName, billerId, providerChosen, amountMinor } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    billerId?: string;
    providerChosen?: string;
    amountMinor?: string;
  }>();
  const kind = billCategoryKind(categoryName);

  const billers = useQuery({
    queryKey: ['bill-billers', categoryId],
    queryFn: () => listBillers(categoryId),
    enabled: Boolean(categoryId),
  });

  // Until the payer chooses, the first provider is shown, as the references do.
  const biller =
    billers.data?.find((candidate) => candidate.id === billerId) ?? billers.data?.[0] ?? null;

  return (
    <>
      {/* The category is the screen's title, so "Airtime" reads as where the
          payer is rather than a generic "Choose a biller". */}
      {categoryName ? <Stack.Screen options={{ title: categoryName }} /> : null}
      {kind ? (
        <BillCategoryScreen
          kind={kind}
          {...(billers.data ? { billers: billers.data } : {})}
          biller={biller}
          // A provider arriving with the route (a repeated bill) or from the
          // list counts as chosen; one detected from the number does not, so a
          // corrected number can still switch networks.
          providerChosen={providerChosen === '1' || Boolean(billerId && providerChosen !== '0')}
          {...(amountMinor ? { initialAmountMinor: amountMinor } : {})}
          loading={billers.isPending}
          error={billers.isError}
          onRetry={() => void billers.refetch()}
          // Detection from a phone number updates the route in place; it is a
          // correction of this screen, not a step to go back through.
          onSelectBiller={(id) => router.setParams({ billerId: id, providerChosen: '0' })}
          onOpenProviders={() =>
            router.push({
              pathname: '/(tabs)/bills/[categoryId]/providers',
              params: {
                categoryId,
                ...(categoryName ? { categoryName } : {}),
                ...(biller ? { billerId: biller.id } : {}),
              },
            })
          }
          onContinue={({ biller: chosen, product, customerReference, amountMinor: amount }) =>
            // push: the payer can back out of the confirmation to change anything.
            router.push({
              pathname: '/(tabs)/bills/[categoryId]/pay',
              params: {
                categoryId,
                billerId: chosen.id,
                customerReference,
                amountMinor: amount,
                ...(product ? { productId: product.id } : {}),
                ...(categoryName ? { categoryName } : {}),
              },
            })
          }
        />
      ) : (
        <AppErrorState
          title="Not available"
          description="This kind of bill cannot be paid in the app yet."
          onRetry={() => router.replace('/(tabs)/bills')}
        />
      )}
    </>
  );
}
