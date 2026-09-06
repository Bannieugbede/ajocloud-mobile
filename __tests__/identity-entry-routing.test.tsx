import { act, fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import IdentityCompleteRoute from '@/app/(auth)/identity-complete';
import VerifyIdentityRoute from '@/app/(auth)/verify-identity';
import { useRegistrationStore } from '@/store/registration-store';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

/**
 * The identity screens serve two callers with different exits.
 *
 * During registration they are steps, and finishing moves on to the last one.
 * From Profile the member is already signed in, and being pushed through the
 * end of an onboarding they completed months ago is disorienting — worse, the
 * final step calls `finish()` on a registration that is not happening.
 *
 * `step` on the registration store is what tells them apart: it is null for
 * anyone who is not mid-registration.
 */

beforeEach(() => {
  jest.clearAllMocks();
});

describe('leaving identity verification without doing it', () => {
  it('continues the registration when one is in progress', async () => {
    useRegistrationStore.setState({ step: 'verify-email' });
    const view = await render(<VerifyIdentityRoute />);

    await act(async () => fireEvent.press(view.getByText("I'll do this later")));

    expect(router.replace).toHaveBeenCalledWith('/(auth)/intent');
  });

  it('returns a signed-in member to Profile, where they started', async () => {
    // Sending them to the onboarding intent screen would ask someone who has
    // been using the app for months what they want to use it for.
    useRegistrationStore.setState({ step: null });
    const view = await render(<VerifyIdentityRoute />);

    await act(async () => fireEvent.press(view.getByText("I'll do this later")));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/profile');
  });
});

describe('finishing identity verification', () => {
  it('continues the registration when one is in progress', async () => {
    useRegistrationStore.setState({ step: 'verify-email' });
    const view = await render(<IdentityCompleteRoute />);

    await act(async () => fireEvent.press(view.getByRole('button')));

    expect(router.replace).toHaveBeenCalledWith('/(auth)/intent');
  });

  it('returns a signed-in member to Profile, where the badge they earned is', async () => {
    useRegistrationStore.setState({ step: null });
    const view = await render(<IdentityCompleteRoute />);

    await act(async () => fireEvent.press(view.getByRole('button')));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)/profile');
  });
});
