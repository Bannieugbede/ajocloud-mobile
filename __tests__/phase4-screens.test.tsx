import { act, fireEvent, render } from '@testing-library/react-native';

import type { LinkedBankAccount } from '@/api/endpoints/kyc';
import { CreateGoalScreen } from '@/features/akawo/create-goal-screen';
import { ProfileMenuScreen } from '@/features/profile/profile-menu-screen';
import { SecurityScreen } from '@/features/profile/security-screen';
import { SupportScreen } from '@/features/profile/support-screen';
import { SendMoneyScreen } from '@/features/wallet/send-money-screen';
import { WithdrawScreen } from '@/features/wallet/withdraw-screen';

describe('CreateGoalScreen', () => {
  const setup = async (onSubmit = jest.fn()) =>
    await render(<CreateGoalScreen submitting={false} onSubmit={onSubmit} />);

  it('asks a target goal for an amount', async () => {
    const view = await setup();
    expect(view.getByLabelText('Amount you are saving towards')).toBeTruthy();
  });

  it('does not submit an incomplete form', async () => {
    const onSubmit = jest.fn();
    const view = await setup(onSubmit);
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Create goal' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.getByText(/at least 3 characters/i)).toBeTruthy();
  });

  it('converts naira to minor units when submitting', async () => {
    const onSubmit = jest.fn();
    const view = await setup(onSubmit);
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('What are you saving for?'), 'School fees');
      fireEvent.changeText(view.getByLabelText('Amount you are saving towards'), '50000');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Create goal' }));
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ targetMinor: '5000000', type: 'TARGET' }),
    );
  });
});

describe('SendMoneyScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <SendMoneyScreen
        availableMinor="10000000"
        currency="NGN"
        submitting={false}
        onSubmit={jest.fn()}
        {...overrides}
      />,
    );

  it('shows what is available to send', async () => {
    const view = await setup();
    expect(view.getByText('₦100,000.00')).toBeTruthy();
  });

  it('will not send without a PIN', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText("Recipient's email"), 'them@example.test');
      fireEvent.changeText(view.getByLabelText('Amount'), '500');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Send money' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses more than the balance, and says the balance', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit, availableMinor: '10000' });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText("Recipient's email"), 'them@example.test');
      fireEvent.changeText(view.getByLabelText('Amount'), '5000');
      fireEvent.changeText(view.getByLabelText('Transaction PIN'), '1357');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Send money' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.getByText(/₦100\.00 available/)).toBeTruthy();
  });

  it('warns that a send cannot be undone', async () => {
    const view = await setup();
    expect(view.getByText(/cannot be undone/i)).toBeTruthy();
  });
});

const account: LinkedBankAccount = {
  id: 'bank-1',
  bankCode: '000001',
  bankName: 'Test Bank',
  accountMasked: '******6789',
  accountName: 'Ada Admin',
  verifiedAt: '2026-01-02T00:00:00.000Z',
};

describe('WithdrawScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <WithdrawScreen
        accounts={[account]}
        availableMinor="10000000"
        currency="NGN"
        submitting={false}
        onAddAccount={jest.fn()}
        onSubmit={jest.fn()}
        {...overrides}
      />,
    );

  it('sends someone with no linked account to add one', async () => {
    const onAddAccount = jest.fn();
    const view = await setup({ accounts: [], onAddAccount });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Add a bank account' }));
    });
    expect(onAddAccount).toHaveBeenCalled();
  });

  it('never claims the money has been sent', async () => {
    // The payout is released by an operator, so the wording must not imply the
    // money has already left.
    const view = await setup();
    expect(view.getByRole('button', { name: 'Request payout' })).toBeTruthy();
    expect(view.getByText(/hold this amount aside/i)).toBeTruthy();
  });
});

describe('SecurityScreen', () => {
  const setup = async (overrides = {}) =>
    await render(
      <SecurityScreen
        hasPin
        lockedUntil={null}
        biometricsAvailable
        biometricsEnabled={false}
        submitting={false}
        saved={false}
        onToggleBiometrics={jest.fn()}
        onSubmit={jest.fn()}
        {...overrides}
      />,
    );

  it('requires the current PIN before replacing it', async () => {
    // Otherwise a borrowed unlocked phone is enough to take over payments.
    const view = await setup();
    expect(view.getByLabelText('Current PIN')).toBeTruthy();
  });

  it('does not ask for a current PIN when none is set', async () => {
    const view = await setup({ hasPin: false });
    expect(view.queryByLabelText('Current PIN')).toBeNull();
  });

  it('refuses a mismatched confirmation', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ hasPin: false, onSubmit });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('New PIN'), '1357');
      fireEvent.changeText(view.getByLabelText('Confirm new PIN'), '2468');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Set PIN' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.getByText(/do not match/i)).toBeTruthy();
  });

  it('hides the biometric toggle where the device has no sensor', async () => {
    const view = await setup({ biometricsAvailable: false });
    expect(view.queryByLabelText('Unlock with biometrics')).toBeNull();
  });

  it('blocks changing the PIN while it is locked out', async () => {
    const view = await setup({ lockedUntil: '2099-01-01T00:00:00.000Z' });
    expect(view.getByText(/Too many wrong attempts/i)).toBeTruthy();
  });
});

describe('SupportScreen', () => {
  it('refuses a message too short to act on', async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <SupportScreen
        submitting={false}
        sent={false}
        onSubmit={onSubmit}
        onStartAnother={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.changeText(view.getByLabelText('Subject'), 'Help');
      fireEvent.changeText(view.getByLabelText('Message'), 'short');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Send message' }));
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('confirms once sent rather than leaving the form filled in', async () => {
    const view = await render(
      <SupportScreen submitting={false} sent onSubmit={jest.fn()} onStartAnother={jest.fn()} />,
    );
    expect(view.getByText(/we have your message/i)).toBeTruthy();
  });
});

describe('ProfileMenuScreen', () => {
  const kyc = {
    tier: 'TIER_1' as const,
    status: 'PENDING',
    steps: {
      personalDetails: { complete: true },
      identity: { complete: false, maskedIdentifier: null, kind: null },
      bankAccount: { complete: false },
    },
  };

  it('names what verification is still missing rather than showing a tier code', async () => {
    const view = await render(
      <ProfileMenuScreen
        kyc={kyc}
        loading={false}
        signingOut={false}
        onEditProfile={jest.fn()}
        onOpenSecurity={jest.fn()}
        onOpenNotifications={jest.fn()}
        onOpenInbox={jest.fn()}
        unreadCount={0}
        onOpenSupport={jest.fn()}
        onOpenLegal={jest.fn()}
        onCompleteKyc={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );
    expect(view.getByText('Basic account')).toBeTruthy();
    expect(view.getByText(/your BVN or NIN, a bank account/)).toBeTruthy();
  });

  it('says verification is done when nothing is outstanding', async () => {
    const view = await render(
      <ProfileMenuScreen
        kyc={{
          ...kyc,
          tier: 'TIER_3',
          steps: {
            personalDetails: { complete: true },
            identity: { complete: true, maskedIdentifier: '*******1234', kind: 'BVN' },
            bankAccount: { complete: true },
          },
        }}
        loading={false}
        signingOut={false}
        onEditProfile={jest.fn()}
        onOpenSecurity={jest.fn()}
        onOpenNotifications={jest.fn()}
        onOpenInbox={jest.fn()}
        unreadCount={0}
        onOpenSupport={jest.fn()}
        onOpenLegal={jest.fn()}
        onCompleteKyc={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );
    expect(view.getByText(/verification is complete/i)).toBeTruthy();
  });
});
