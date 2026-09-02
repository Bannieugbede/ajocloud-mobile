import { act, fireEvent, render } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home/home-screen';

it('renders the reference dashboard hierarchy without invented balances', async () => {
  const onToggleBalance = jest.fn();
  const onOpenAjo = jest.fn();
  const view = await render(
    <HomeScreen
      user={{
        id: 'user',
        email: 'ayo@example.com',
        phone: '+2348012345678',
        status: 'ACTIVE',
        profile: { firstName: 'Ayo', lastName: 'Cloud', avatarUrl: null },
      }}
      wallets={[]}
      groups={[]}
      loading={false}
      error={false}
      balanceVisible
      onToggleBalance={onToggleBalance}
      onRetry={jest.fn()}
      onOpenAjo={onOpenAjo}
      onOpenAkawo={jest.fn()}
      onPayBill={jest.fn()}
    />,
  );

  expect(view.getByText('Ayo Cloud')).toBeTruthy();
  expect(view.getByText('Balance unavailable')).toBeTruthy();
  expect(view.getByText('Upcoming Activity')).toBeTruthy();
  expect(view.getByText('My Ajo Groups')).toBeTruthy();
  expect(view.getByText('Akawo Goals')).toBeTruthy();
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Hide wallet balance' })));
  expect(onToggleBalance).toHaveBeenCalledTimes(1);
  const seeAll = view.getAllByRole('button', { name: 'See all' });
  await act(async () => fireEvent.press(seeAll[0]));
  expect(onOpenAjo).toHaveBeenCalledTimes(1);
});
