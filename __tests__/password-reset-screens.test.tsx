import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { completePasswordReset, requestPasswordReset } from '@/api/endpoints/auth';
import { ForgotPasswordScreen } from '@/features/auth/forgot-password-screen';
import { ResetPasswordScreen } from '@/features/auth/reset-password-screen';

jest.mock('@/api/endpoints/auth', () => ({
  completePasswordReset: jest.fn(),
  requestPasswordReset: jest.fn(),
}));

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      queries: { gcTime: Number.POSITIVE_INFINITY },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const challenge = {
  challengeId: '11111111-1111-4111-8111-111111111111',
  destinationMasked: 'ad•••@example.test',
  expiresAt: '2099-01-01T00:00:00.000Z',
  resendAvailableAt: '2020-01-01T00:00:00.000Z',
};

beforeEach(() => jest.clearAllMocks());

it('requests a reset code with a normalised email address', async () => {
  jest.mocked(requestPasswordReset).mockResolvedValue(challenge);
  const onCodeSent = jest.fn();
  const view = await render(<ForgotPasswordScreen onCodeSent={onCodeSent} />, {
    wrapper: Wrapper,
  });

  await fireEvent.changeText(view.getByLabelText('Email address'), '  Ada@Example.test ');
  await fireEvent.press(view.getByRole('button', { name: 'Send reset code' }));

  await waitFor(() =>
    expect(jest.mocked(requestPasswordReset).mock.calls[0][0]).toBe('ada@example.test'),
  );
  await waitFor(() => expect(onCodeSent).toHaveBeenCalledWith(challenge));
  await view.unmount();
});

it('does not call the backend for an invalid email', async () => {
  const view = await render(<ForgotPasswordScreen onCodeSent={jest.fn()} />, { wrapper: Wrapper });
  await fireEvent.changeText(view.getByLabelText('Email address'), 'not-an-email');
  await fireEvent.press(view.getByRole('button', { name: 'Send reset code' }));
  await waitFor(() => expect(view.getByText('Enter a valid email address')).toBeTruthy());
  expect(requestPasswordReset).not.toHaveBeenCalled();
  await view.unmount();
});

it('submits the code and the new password', async () => {
  jest.mocked(completePasswordReset).mockResolvedValue(undefined);
  const onReset = jest.fn();
  const view = await render(
    <ResetPasswordScreen
      challengeId={challenge.challengeId}
      destinationMasked={challenge.destinationMasked}
      onReset={onReset}
    />,
    { wrapper: Wrapper },
  );

  await fireEvent.changeText(view.getByLabelText('Verification code'), '123456');
  await fireEvent.changeText(view.getByLabelText('New password'), 'a-brand-new-password');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'a-brand-new-password');
  await fireEvent.press(view.getByRole('button', { name: 'Update password' }));

  await waitFor(() =>
    expect(jest.mocked(completePasswordReset).mock.calls[0][0]).toEqual({
      challengeId: challenge.challengeId,
      code: '123456',
      password: 'a-brand-new-password',
    }),
  );
  await waitFor(() => expect(onReset).toHaveBeenCalledTimes(1));
  await view.unmount();
});

it('refuses mismatched passwords before calling the backend', async () => {
  const view = await render(
    <ResetPasswordScreen
      challengeId={challenge.challengeId}
      destinationMasked={challenge.destinationMasked}
      onReset={jest.fn()}
    />,
    { wrapper: Wrapper },
  );

  await fireEvent.changeText(view.getByLabelText('Verification code'), '123456');
  await fireEvent.changeText(view.getByLabelText('New password'), 'a-brand-new-password');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'a-different-password');
  await fireEvent.press(view.getByRole('button', { name: 'Update password' }));

  await waitFor(() => expect(view.getByText('Passwords do not match')).toBeTruthy());
  expect(completePasswordReset).not.toHaveBeenCalled();
  await view.unmount();
});

it('enforces the same minimum password length as the backend', async () => {
  const view = await render(
    <ResetPasswordScreen
      challengeId={challenge.challengeId}
      destinationMasked={challenge.destinationMasked}
      onReset={jest.fn()}
    />,
    { wrapper: Wrapper },
  );

  await fireEvent.changeText(view.getByLabelText('Verification code'), '123456');
  await fireEvent.changeText(view.getByLabelText('New password'), 'short');
  await fireEvent.changeText(view.getByLabelText('Confirm new password'), 'short');
  await fireEvent.press(view.getByRole('button', { name: 'Update password' }));

  await waitFor(() => expect(view.getByText('Use at least 12 characters')).toBeTruthy());
  expect(completePasswordReset).not.toHaveBeenCalled();
  await view.unmount();
});
