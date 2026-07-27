import { act, fireEvent, render } from '@testing-library/react-native';

import { WelcomeScreen } from '@/features/auth/welcome-screen';

it('renders accessible account entry actions and invokes each destination', async () => {
  const onCreateAccount = jest.fn();
  const onSignIn = jest.fn();
  const onPrivacy = jest.fn();
  const onTerms = jest.fn();
  const view = await render(
    <WelcomeScreen
      onCreateAccount={onCreateAccount}
      onPrivacy={onPrivacy}
      onSignIn={onSignIn}
      onTerms={onTerms}
    />,
  );

  expect(view.getByText('Your savings community, now in the cloud.')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Create an account' }));
  });
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
  });
  expect(onCreateAccount).toHaveBeenCalledTimes(1);
  expect(onSignIn).toHaveBeenCalledTimes(1);
  expect(view.queryByRole('button', { name: 'Learn how it works' })).toBeNull();
  expect(view.getByText('Community savings')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Terms of Service' }));
  });
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Privacy Policy' }));
  });
  expect(onTerms).toHaveBeenCalledTimes(1);
  expect(onPrivacy).toHaveBeenCalledTimes(1);
});
