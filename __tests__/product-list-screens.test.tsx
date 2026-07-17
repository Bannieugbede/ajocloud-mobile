import { act, fireEvent, render } from '@testing-library/react-native';
import { AjoListScreen } from '@/features/ajo/ajo-list-screen';
import { FoodListScreen } from '@/features/food/food-list-screen';

it('opens a live Ajo group summary', async () => {
  const onOpen = jest.fn();
  const view = await render(
    <AjoListScreen
      loading={false}
      error={false}
      onRetry={jest.fn()}
      onOpen={onOpen}
      groups={[
        {
          id: 'group',
          name: 'Market Circle',
          status: 'ACTIVE',
          contributionFrequency: 'MONTHLY',
          contributionMode: 'FIXED',
          baseContributionMinor: '2500000',
          currency: 'NGN',
          maxSlots: 12,
          maxMembers: 12,
          startDate: '2026-08-01',
          endDate: '2027-07-01',
          _count: { slots: 8, members: 8 },
        },
      ]}
    />,
  );
  expect(view.getByText('₦25,000.00')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Open Market Circle' })));
  expect(onOpen).toHaveBeenCalledWith('group');
});

it('opens a live Food Ajo programme', async () => {
  const onOpen = jest.fn();
  const view = await render(
    <FoodListScreen
      loading={false}
      error={false}
      onRetry={jest.fn()}
      onOpen={onOpen}
      programmes={[
        {
          id: 'food',
          coordinatorUserId: 'user',
          name: 'Family Staples',
          status: 'ACTIVE',
          currency: 'NGN',
          contributionMinor: '1000000',
          contributionFrequency: 'MONTHLY',
          enrolmentCapacity: 50,
          fulfilmentMethod: 'PICKUP',
          startsAt: '2026-08-01',
          endsAt: '2026-12-01',
          plannedProcurementAt: null,
          distributionAt: null,
          packages: [],
          _count: { subscriptions: 12 },
        },
      ]}
    />,
  );
  expect(view.getByText('₦10,000.00')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Open Family Staples' })));
  expect(onOpen).toHaveBeenCalledWith('food');
});
