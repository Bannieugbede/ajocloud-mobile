import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { login, resendVerification, registerAccount, verifyEmail } from '@/api/endpoints/auth';
import { RegisterScreen } from '@/features/auth/register-screen';
import { SignInScreen } from '@/features/auth/sign-in-screen';
import { VerificationScreen } from '@/features/auth/verification-screen';

jest.mock('@/api/endpoints/auth', () => ({
  login: jest.fn(),
  registerAccount: jest.fn(),
  resendVerification: jest.fn(),
  verifyEmail: jest.fn(),
}));

const challenge = {
  userId: '40000000-0000-4000-8000-000000000001',
  channel: 'EMAIL' as const,
  destinationMasked: 'ad•••@example.test',
  expiresAt: '2099-01-01T00:00:00.000Z',
  resendAvailableAt: '2020-01-01T00:00:00.000Z',
  deliveryStatus: 'SENT' as const,
};

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      queries: { gcTime: Number.POSITIVE_INFINITY },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => jest.clearAllMocks());

it('validates registration locally before calling the backend', async () => {
  const view = await render(<RegisterScreen onRegistered={jest.fn()} onSignIn={jest.fn()} />, {
    wrapper: Wrapper,
  });
  await fireEvent.press(view.getByRole('button', { name: 'Create account' }));
  expect(await view.findByText('Enter your first name')).toBeTruthy();
  expect(registerAccount).not.toHaveBeenCalled();
  await view.unmount();
});

it('submits a complete registration and its required consent', async () => {
  jest.mocked(registerAccount).mockResolvedValue(challenge);
  const onRegistered = jest.fn();
  const view = await render(<RegisterScreen onRegistered={onRegistered} onSignIn={jest.fn()} />, {
    wrapper: Wrapper,
  });
  await fireEvent.changeText(view.getByLabelText('First name'), 'Ada');
  await fireEvent.changeText(view.getByLabelText('Last name'), 'Member');
  await fireEvent.changeText(view.getByLabelText('Email address'), 'ada@example.test');
  await fireEvent.changeText(view.getByLabelText('Password'), 'Development-Password-123!');
  await fireEvent.changeText(view.getByLabelText('Confirm password'), 'Development-Password-123!');
  await fireEvent(
    view.getByRole('switch', { name: 'I accept the Terms of Service' }),
    'valueChange',
    true,
  );
  await fireEvent(
    view.getByRole('switch', { name: 'I accept the Privacy Policy' }),
    'valueChange',
    true,
  );
  await fireEvent.press(view.getByRole('button', { name: 'Create account' }));
  await waitFor(() => expect(registerAccount).toHaveBeenCalledTimes(1));
  expect(jest.mocked(registerAccount).mock.calls[0]?.[0]).toEqual({
    firstName: 'Ada',
    lastName: 'Member',
    email: 'ada@example.test',
    password: 'Development-Password-123!',
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  await waitFor(() => expect(onRegistered).toHaveBeenCalledWith(challenge));
  await view.unmount();
});

it('verifies email and returns a secure token pair', async () => {
  const tokens = {
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresIn: '15m',
    accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  };
  jest.mocked(verifyEmail).mockResolvedValue(tokens);
  const onEmailVerified = jest.fn();
  const view = await render(
    <VerificationScreen initialChallenge={challenge} onEmailVerified={onEmailVerified} />,
    { wrapper: Wrapper },
  );
  await fireEvent.changeText(view.getByLabelText('Verification code'), '222222');
  await fireEvent.press(view.getByRole('button', { name: 'Verify' }));
  await waitFor(() => expect(onEmailVerified).toHaveBeenCalledWith(tokens));
  await view.unmount();
});

it('submits verified credentials from the sign-in screen', async () => {
  const tokens = {
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresIn: '15m',
    accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  };
  jest.mocked(login).mockResolvedValue(tokens);
  const onSignedIn = jest.fn();
  const view = await render(<SignInScreen onSignedIn={onSignedIn} onRegister={jest.fn()} />, {
    wrapper: Wrapper,
  });
  await fireEvent.changeText(view.getByLabelText('Email address'), 'ada@example.test');
  await fireEvent.changeText(view.getByLabelText('Password'), 'Development-Password-123!');
  await fireEvent.press(view.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(tokens));
  await view.unmount();
});
