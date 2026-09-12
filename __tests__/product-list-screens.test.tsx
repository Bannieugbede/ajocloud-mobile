import { act, fireEvent, render } from '@testing-library/react-native';
import { AjoListScreen } from '@/features/ajo/ajo-list-screen';
import { FoodListScreen } from '@/features/food/food-list-screen';

it('opens a live Ajo group summary', async () => {
  const onOpen = jest.fn();
  const view = await render(
    <AjoListScreen
      loading={false}
      error={false}
      refreshing={false}
      onRefresh={jest.fn()}
      onRetry={jest.fn()}
      onOpen={onOpen}
      onCreate={jest.fn()}
      onJoin={jest.fn()}
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
  // The label carries the figures a screen reader user would otherwise have to
  // hunt for across four separate text nodes.
  await act(async () => fireEvent.press(view.getByLabelText(/^Open Market Circle, Active/)));
  expect(onOpen).toHaveBeenCalledWith('group');
});

it('opens a live Food Ajo programme', async () => {
  const onOpen = jest.fn();
  const view = await render(
    <FoodListScreen
      loading={false}
      error={false}
      refreshing={false}
      onRefresh={jest.fn()}
      onApplyAsCoordinator={jest.fn()}
      onCreate={jest.fn()}
      onJoin={jest.fn()}
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
  // The label now states enrolment too, which is the fact that decides whether
  // joining is still possible.
  await act(async () => fireEvent.press(view.getByLabelText(/^Open Family Staples, 12 of/)));
  expect(onOpen).toHaveBeenCalledWith('food');
});

describe('Food Ajo tabs and Start sheet', () => {
  const programme = {
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
  };

  const subscription = {
    id: 'sub-1',
    groupId: 'joined',
    packageId: 'pkg-1',
    status: 'ACTIVE',
    quantity: 1,
    fulfilmentMethod: 'PICKUP',
    createdAt: '2026-08-01T00:00:00Z',
    group: { name: 'Estate Provisions', status: 'ACTIVE', distributionAt: null },
    package: { name: 'Silver', priceMinor: '5400000', currency: 'NGN' },
  };

  function setup(overrides: Record<string, unknown> = {}) {
    return render(
      <FoodListScreen
        loading={false}
        error={false}
        refreshing={false}
        onRefresh={jest.fn()}
        onRetry={jest.fn()}
        onOpen={jest.fn()}
        onApplyAsCoordinator={jest.fn()}
        onCreate={jest.fn()}
        onJoin={jest.fn()}
        programmes={[programme as never]}
        subscriptions={[subscription as never]}
        {...overrides}
      />,
    );
  }

  it('opens on Packages and swaps the list for Active', async () => {
    const view = await setup();

    // Packages first: the tab exists to find a programme, and someone with no
    // plans yet would otherwise open on an empty screen.
    expect(view.getByText('Family Staples')).toBeTruthy();
    expect(view.queryByText('Estate Provisions')).toBeNull();

    await act(async () => fireEvent.press(view.getByLabelText('Active')));

    expect(view.getByText('Estate Provisions')).toBeTruthy();
    expect(view.queryByText('Family Staples')).toBeNull();
  });

  it('says which list is empty rather than showing nothing', async () => {
    const view = await setup({ subscriptions: [] });
    await act(async () => fireEvent.press(view.getByLabelText('Active')));
    expect(view.getByText('No active plans')).toBeTruthy();
  });

  it('reports a failed load on either tab', async () => {
    // One request failing leaves neither list trustworthy, so an error shown
    // only on Packages would let Active look merely empty.
    const view = await setup({ error: true });
    expect(view.getByText('Could not load Food Ajo')).toBeTruthy();

    await act(async () => fireEvent.press(view.getByLabelText('Active')));
    expect(view.getByText('Could not load Food Ajo')).toBeTruthy();
  });

  it('offers Create and Join from the Start button', async () => {
    const onCreate = jest.fn();
    const view = await setup({ onCreate });

    // The sheet is closed until asked for.
    expect(view.queryByText('Start a Food Ajo')).toBeNull();

    await act(async () => fireEvent.press(view.getByLabelText('Start')));
    expect(view.getByText('Start a Food Ajo')).toBeTruthy();
    expect(view.getByLabelText(/^Create\./)).toBeTruthy();
    expect(view.getByLabelText(/^Join\./)).toBeTruthy();

    await act(async () => fireEvent.press(view.getByLabelText(/^Create\./)));
    expect(onCreate).toHaveBeenCalledTimes(1);
    // Closed before navigating, so the sheet is not left over the next screen.
    expect(view.queryByText('Start a Food Ajo')).toBeNull();
  });

  it('can be dismissed without choosing anything', async () => {
    const onCreate = jest.fn();
    const onJoin = jest.fn();
    const view = await setup({ onCreate, onJoin });

    await act(async () => fireEvent.press(view.getByLabelText('Start')));
    await act(async () => fireEvent.press(view.getByLabelText('Close')));

    expect(view.queryByText('Start a Food Ajo')).toBeNull();
    expect(onCreate).not.toHaveBeenCalled();
    expect(onJoin).not.toHaveBeenCalled();
  });
});
