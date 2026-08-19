import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import {
  inquireAccount,
  linkBankAccount,
  listBanks,
  updatePersonalDetails,
  verifyIdentity,
} from '@/api/endpoints/kyc';
import { BankAccountStep } from './bank-account-step';
import { IdentityDocumentStep } from './identity-document-step';
import { PersonalDetailsStep } from './personal-details-step';

jest.mock('@/api/endpoints/kyc', () => ({
  inquireAccount: jest.fn(),
  linkBankAccount: jest.fn(),
  listBanks: jest.fn(),
  updatePersonalDetails: jest.fn(),
  verifyIdentity: jest.fn(),
}));

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(listBanks).mockResolvedValue({
    banks: [{ code: '000001', name: 'Test Bank' }],
  });
});

describe('PersonalDetailsStep', () => {
  it('rejects a date that does not exist', async () => {
    const view = await render(<PersonalDetailsStep onSaved={jest.fn()} />, { wrapper: Wrapper });
    await fireEvent.changeText(view.getByLabelText('Date of birth'), '31022000');
    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(await view.findByText('That date does not exist')).toBeTruthy();
    expect(updatePersonalDetails).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('refuses someone under eighteen without calling the backend', async () => {
    const view = await render(<PersonalDetailsStep onSaved={jest.fn()} />, { wrapper: Wrapper });
    await fireEvent.changeText(view.getByLabelText('Date of birth'), '01012015');
    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(await view.findByText('You must be at least 18 years old')).toBeTruthy();
    expect(updatePersonalDetails).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('formats the typed date so the user only enters digits', async () => {
    const view = await render(<PersonalDetailsStep onSaved={jest.fn()} />, { wrapper: Wrapper });
    const field = view.getByLabelText('Date of birth');
    await fireEvent.changeText(field, '01011995');
    expect(field.props.value).toBe('01/01/1995');
    await view.unmount();
  });
});

describe('IdentityDocumentStep', () => {
  it('requires consent before the number is sent anywhere', async () => {
    const view = await render(<IdentityDocumentStep onVerified={jest.fn()} />, {
      wrapper: Wrapper,
    });
    await fireEvent.changeText(view.getByLabelText('BVN number'), '22345678901');
    await fireEvent.press(view.getByRole('button', { name: 'Verify' }));
    expect(await view.findByText('Tick the box to let us verify your details')).toBeTruthy();
    expect(verifyIdentity).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('rejects a number of the wrong length locally', async () => {
    const view = await render(<IdentityDocumentStep onVerified={jest.fn()} />, {
      wrapper: Wrapper,
    });
    await fireEvent.changeText(view.getByLabelText('BVN number'), '223456');
    await fireEvent.press(view.getByRole('button', { name: 'Verify' }));
    expect(await view.findByText('Your BVN is 11 digits')).toBeTruthy();
    expect(verifyIdentity).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('submits with consent and clears the number from state afterwards', async () => {
    jest.mocked(verifyIdentity).mockResolvedValue({
      verified: true,
      maskedIdentifier: '*******8901',
      requiresReview: false,
    });
    const onVerified = jest.fn();
    const view = await render(<IdentityDocumentStep onVerified={onVerified} />, {
      wrapper: Wrapper,
    });

    const field = view.getByLabelText('BVN number');
    await fireEvent.changeText(field, '22345678901');
    await fireEvent.press(
      view.getByRole('checkbox', {
        name: 'I allow Ajo Cloud to verify my BVN with the identity authority',
      }),
    );
    await fireEvent.press(view.getByRole('button', { name: 'Verify' }));

    await waitFor(() => expect(verifyIdentity).toHaveBeenCalledTimes(1));
    expect(jest.mocked(verifyIdentity).mock.calls[0]?.[0]).toEqual({
      kind: 'BVN',
      identityNumber: '22345678901',
      consent: true,
    });
    // The number must not linger in the field once it has been sent.
    await waitFor(() => expect(view.getByLabelText('BVN number').props.value).toBe(''));
    expect(onVerified).toHaveBeenCalled();
    await view.unmount();
  });

  it('clears a typed number when the scheme is switched', async () => {
    const view = await render(<IdentityDocumentStep onVerified={jest.fn()} />, {
      wrapper: Wrapper,
    });
    await fireEvent.changeText(view.getByLabelText('BVN number'), '22345678901');
    await fireEvent.press(view.getByRole('tab', { name: 'NIN' }));
    expect(view.getByLabelText('NIN number').props.value).toBe('');
    await view.unmount();
  });

  it('strips non-digits so only a numeric identifier is ever sent', async () => {
    const view = await render(<IdentityDocumentStep onVerified={jest.fn()} />, {
      wrapper: Wrapper,
    });
    const field = view.getByLabelText('BVN number');
    await fireEvent.changeText(field, '22a34-567 8901');
    expect(field.props.value).toBe('22345678901');
    await view.unmount();
  });
});

describe('BankAccountStep', () => {
  it('shows the name the bank returned before anything is linked', async () => {
    jest.mocked(inquireAccount).mockResolvedValue({
      accountName: 'Ada Okafor',
      bankCode: '000001',
    });
    const view = await render(<BankAccountStep onLinked={jest.fn()} />, { wrapper: Wrapper });

    await fireEvent.press(await view.findByTestId('bank-select'));
    await fireEvent.press(await view.findByRole('button', { name: 'Test Bank' }));
    await fireEvent.changeText(view.getByLabelText('Account number'), '0123456789');
    await fireEvent.press(view.getByRole('button', { name: 'Check account' }));

    expect(await view.findByText('Ada Okafor')).toBeTruthy();
    expect(linkBankAccount).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('links only after the user confirms the resolved name', async () => {
    jest.mocked(inquireAccount).mockResolvedValue({
      accountName: 'Ada Okafor',
      bankCode: '000001',
    });
    jest.mocked(linkBankAccount).mockResolvedValue({
      accountMasked: '******6789',
      accountName: 'Ada Okafor',
      bankName: 'Test Bank',
    });
    const onLinked = jest.fn();
    const view = await render(<BankAccountStep onLinked={onLinked} />, { wrapper: Wrapper });

    await fireEvent.press(await view.findByTestId('bank-select'));
    await fireEvent.press(await view.findByRole('button', { name: 'Test Bank' }));
    await fireEvent.changeText(view.getByLabelText('Account number'), '0123456789');
    await fireEvent.press(view.getByRole('button', { name: 'Check account' }));
    await fireEvent.press(await view.findByRole('button', { name: 'This is my account' }));

    await waitFor(() => expect(onLinked).toHaveBeenCalledTimes(1));
    await view.unmount();
  });

  it('discards a resolved name when the account number changes', async () => {
    jest.mocked(inquireAccount).mockResolvedValue({
      accountName: 'Ada Okafor',
      bankCode: '000001',
    });
    const view = await render(<BankAccountStep onLinked={jest.fn()} />, { wrapper: Wrapper });

    await fireEvent.press(await view.findByTestId('bank-select'));
    await fireEvent.press(await view.findByRole('button', { name: 'Test Bank' }));
    await fireEvent.changeText(view.getByLabelText('Account number'), '0123456789');
    await fireEvent.press(view.getByRole('button', { name: 'Check account' }));
    expect(await view.findByText('Ada Okafor')).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText('Account number'), '0123456780');
    // A stale name must not remain against a different number.
    await waitFor(() => expect(view.queryByText('Ada Okafor')).toBeNull());
    await view.unmount();
  });
});
