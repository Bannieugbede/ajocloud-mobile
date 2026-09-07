import { act, fireEvent, render } from '@testing-library/react-native';

import type { FoodProgramme, FoodSubscription } from '@/api/endpoints/food-ajo';
import { FoodDetailScreen } from '@/features/food/food-detail-screen';

// The screen draws its own floating back control, which reads navigation state.
// There is no navigator in a component test, so it is stubbed the same way the
// header-back tests do it.
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
  useNavigation: () => ({ canGoBack: () => false }),
}));

const PACKAGE = {
  id: 'pkg-1',
  name: 'Premium Family Package',
  imageUrl: 'https://example.test/pancakes.jpg',
  description: 'Premium groceries with fresh protein items included',
  priceMinor: '3500000',
  priceLockedAt: '2026-07-01T00:00:00.000Z',
  currency: 'NGN',
  items: [
    { id: 'i1', name: 'Rice', quantity: '25', unit: 'kg' },
    { id: 'i2', name: 'Chicken', quantity: '5', unit: 'kg' },
  ],
};

const programme: FoodProgramme = {
  id: 'prog-1',
  coordinatorUserId: 'user-9',
  name: 'Premium Family Package',
  status: 'OPEN',
  currency: 'NGN',
  contributionMinor: '3500000',
  contributionFrequency: 'MONTHLY',
  enrolmentCapacity: 30,
  fulfilmentMethod: 'PICKUP',
  startsAt: '2026-07-01',
  endsAt: '2026-12-31',
  plannedProcurementAt: null,
  distributionAt: '2026-07-28T00:00:00.000Z',
  packages: [PACKAGE],
  _count: { subscriptions: 28 },
  coordinatorName: 'Chef Ade Williams',
  coordinatorVerified: true,
};

const subscription: FoodSubscription = {
  id: 'sub-1',
  groupId: 'prog-1',
  packageId: 'pkg-1',
  status: 'ACTIVE',
  quantity: 1,
  fulfilmentMethod: 'PICKUP',
  createdAt: '2026-07-01T00:00:00.000Z',
  group: { name: 'Premium Family Package', status: 'OPEN', distributionAt: null },
  package: { name: 'Premium Family Package', priceMinor: '3500000', currency: 'NGN' },
};

function setup(overrides: Partial<React.ComponentProps<typeof FoodDetailScreen>> = {}) {
  return render(
    <FoodDetailScreen
      programme={programme}
      subscription={null}
      loading={false}
      error={false}
      onRetry={jest.fn()}
      onSubscribe={jest.fn()}
      onUnsubscribe={jest.fn()}
      {...overrides}
    />,
  );
}

describe('before joining', () => {
  it('leads with the package, its coordinator and their verification', async () => {
    const view = await setup();
    expect(view.getByText('Premium Family Package')).toBeTruthy();
    expect(view.getByText('Chef Ade Williams')).toBeTruthy();
    expect(view.getByText('Verified')).toBeTruthy();
  });

  it('states the four facts that decide whether to join', async () => {
    const view = await setup();
    expect(view.getByLabelText('₦35,000.00 / Monthly Price')).toBeTruthy();
    expect(view.getByLabelText('28 / 30 Members')).toBeTruthy();
    expect(view.getByLabelText('2 Spots Left')).toBeTruthy();
    expect(view.getByLabelText(/Next Distribution/)).toBeTruthy();
  });

  it('lists what is in the package, with quantities', async () => {
    const view = await setup();
    expect(view.getByLabelText('Rice, 25 kg')).toBeTruthy();
    expect(view.getByLabelText('Chicken, 5 kg')).toBeTruthy();
  });

  it('joins with the package on screen', async () => {
    const onSubscribe = jest.fn();
    const view = await setup({ onSubscribe });
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Join Package' })));
    expect(onSubscribe).toHaveBeenCalledWith('pkg-1');
  });

  it('shows no Joined badge and no schedule tab', async () => {
    const view = await setup();
    expect(view.queryByText('Joined')).toBeNull();
    expect(view.queryByRole('tab', { name: 'Payment Schedule' })).toBeNull();
  });

  it('says why it cannot be joined rather than only disabling the button', async () => {
    // A disabled button with no reason beside it is the thing people complain
    // about.
    const full = await setup({
      programme: { ...programme, _count: { subscriptions: 30 } },
    });
    expect(full.getByText(/Every spot in this programme has been taken/)).toBeTruthy();

    const started = await setup({ programme: { ...programme, status: 'ACTIVE' } });
    expect(started.getByText(/Buying has already started/)).toBeTruthy();
  });

  it('warns while a price can still move', async () => {
    const view = await setup({
      programme: { ...programme, packages: [{ ...PACKAGE, priceLockedAt: null }] },
    });
    expect(view.getByText(/not locked yet/)).toBeTruthy();
  });

  it('offers a package choice only when there is more than one', async () => {
    const single = await setup();
    expect(single.queryByText('Choose a package')).toBeNull();

    const many = await setup({
      programme: {
        ...programme,
        packages: [PACKAGE, { ...PACKAGE, id: 'pkg-2', name: 'Basic Family Package' }],
      },
    });
    expect(many.getByText('Choose a package')).toBeTruthy();
  });

  it('joins with whichever package was chosen', async () => {
    const onSubscribe = jest.fn();
    const view = await setup({
      onSubscribe,
      programme: {
        ...programme,
        packages: [PACKAGE, { ...PACKAGE, id: 'pkg-2', name: 'Basic Family Package' }],
      },
    });
    await act(async () => fireEvent.press(view.getByLabelText('Basic Family Package, ₦35,000.00')));
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Join Package' })));
    expect(onSubscribe).toHaveBeenCalledWith('pkg-2');
  });
});

describe('once joined', () => {
  it('marks the programme as joined', async () => {
    const view = await setup({ subscription });
    expect(view.getByText('Joined')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Join Package' })).toBeNull();
  });

  it('switches to the payment schedule and back', async () => {
    const view = await setup({ subscription });
    expect(view.getByText('Package Contents')).toBeTruthy();

    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Payment Schedule' })));
    expect(view.getByText('Your enrolment')).toBeTruthy();
    expect(view.queryByText('Package Contents')).toBeNull();

    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Details' })));
    expect(view.getByText('Package Contents')).toBeTruthy();
  });

  it('reaches the schedule from the details button too', async () => {
    const view = await setup({ subscription });
    await act(async () =>
      fireEvent.press(view.getByRole('button', { name: 'View Payment Schedule' })),
    );
    expect(view.getByText('Your enrolment')).toBeTruthy();
  });

  it('never claims a payment figure the backend does not hold', async () => {
    // There is no Food contribution model — no payment records, no schedule
    // endpoint. A progress bar here would be a made-up number about someone's
    // money, so the screen says plainly that payments are not tracked yet.
    const view = await setup({ subscription });
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Payment Schedule' })));
    expect(view.getByText('Payments are not tracked here yet')).toBeTruthy();
    expect(view.queryByText(/%$/)).toBeNull();
  });

  it('states the terms of the enrolment it does know', async () => {
    const view = await setup({ subscription });
    await act(async () => fireEvent.press(view.getByRole('tab', { name: 'Payment Schedule' })));
    expect(view.getByLabelText('Contribution: ₦35,000.00 / Monthly')).toBeTruthy();
    expect(view.getByLabelText('Portions: 1 portion')).toBeTruthy();
    expect(view.getByLabelText('How you collect: Pickup')).toBeTruthy();
  });

  it('lets a member leave', async () => {
    const onUnsubscribe = jest.fn();
    const view = await setup({ subscription, onUnsubscribe });
    await act(async () =>
      fireEvent.press(view.getByRole('button', { name: 'Leave this programme' })),
    );
    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('treats a cancelled enrolment as not joined', async () => {
    const view = await setup({ subscription: { ...subscription, status: 'CANCELLED' } });
    expect(view.queryByText('Joined')).toBeNull();
    expect(view.getByRole('button', { name: 'Join Package' })).toBeTruthy();
  });
});

describe('states', () => {
  it('offers a way back even when the programme will not load', async () => {
    // The navigator draws no header here, so without this a failed load leaves
    // only the tab bar.
    const view = await setup({ programme: undefined, error: true });
    expect(view.getByLabelText('Go back')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('shows a skeleton rather than an empty screen while loading', async () => {
    const view = await setup({ loading: true });
    expect(view.getByTestId('food-detail-skeleton')).toBeTruthy();
    expect(view.getByLabelText('Go back')).toBeTruthy();
  });
});
