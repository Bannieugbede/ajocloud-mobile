import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { listBillers } from '@/api/endpoints/bill-payments';
import { billCategoryKind } from '@/features/bills/bill-catalog-view';
import { ProviderPickerScreen } from '@/features/bills/provider-picker-screen';

export default function BillProvidersRoute() {
  const { categoryId, categoryName, billerId } = useLocalSearchParams<{
    categoryId: string;
    categoryName?: string;
    billerId?: string;
  }>();
  const kind = billCategoryKind(categoryName);

  // Same key as the form, so the list is already loaded when this opens.
  const billers = useQuery({
    queryKey: ['bill-billers', categoryId],
    queryFn: () => listBillers(categoryId),
    enabled: Boolean(categoryId),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: kind === 'airtime' || kind === 'internet' ? 'Choose network' : 'Choose provider',
        }}
      />
      <ProviderPickerScreen
        kind={kind}
        {...(billers.data ? { billers: billers.data } : {})}
        selectedId={billerId ?? null}
        loading={billers.isPending}
        error={billers.isError}
        onRetry={() => void billers.refetch()}
        // dismissTo: returns to the form already in the stack, with the choice,
        // rather than pushing a second copy of it.
        onSelect={(biller) =>
          router.dismissTo({
            pathname: '/(tabs)/bills/[categoryId]',
            params: {
              categoryId,
              billerId: biller.id,
              providerChosen: '1',
              ...(categoryName ? { categoryName } : {}),
            },
          })
        }
      />
    </>
  );
}
