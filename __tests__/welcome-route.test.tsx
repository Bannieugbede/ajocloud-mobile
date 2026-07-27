import { act, fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import WelcomeRoute from '@/app/(auth)/welcome';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

const mockPush = jest.mocked(router.push);

beforeEach(() => jest.clearAllMocks());

it('routes directly from Welcome to registration and sign in', async () => {
  const view = await render(<WelcomeRoute />);

  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Create an account' }));
  });
  expect(mockPush).toHaveBeenLastCalledWith('/(auth)/register');

  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
  });
  expect(mockPush).toHaveBeenLastCalledWith('/(auth)/sign-in');
});
