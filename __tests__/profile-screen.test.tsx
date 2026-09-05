import { act, fireEvent, render } from '@testing-library/react-native';

import {
  ProfileMenuScreen,
  type ProfileMenuScreenProps,
} from '@/features/profile/profile-menu-screen';

const verifiedKyc = {
  tier: 'TIER_3' as const,
  status: 'VERIFIED',
  steps: {
    personalDetails: { complete: true },
    identity: { complete: true, maskedIdentifier: '*******1234', kind: 'BVN' },
    bankAccount: { complete: true },
  },
};

function props(overrides: Partial<ProfileMenuScreenProps> = {}): ProfileMenuScreenProps {
  return {
    user: {
      id: 'user',
      email: 'chisom@ajocloud.ng',
      phone: '+2348012345678',
      status: 'ACTIVE',
      profile: {
        firstName: 'Chisom',
        lastName: 'Okafor',
        avatarUrl: null,
        timezone: 'Africa/Lagos',
        locale: 'en-NG',
      },
    },
    kyc: verifiedKyc,
    referrals: {
      totalRewardMinor: '600000',
      currency: 'NGN',
      referralCount: 12,
      qualifiedCount: 6,
      code: 'AJO-CH2SOM',
    },
    availableMinor: '84732050',
    savingsMinor: '23450000',
    currency: 'NGN',
    loading: false,
    signingOut: false,
    themePreference: 'system',
    onChangeTheme: jest.fn(),
    onCopyReferralCode: jest.fn(),
    onShareReferralCode: jest.fn(),
    onEditProfile: jest.fn(),
    onOpenSecurity: jest.fn(),
    onOpenNotifications: jest.fn(),
    onOpenInbox: jest.fn(),
    unreadCount: 0,
    onOpenBankAccounts: jest.fn(),
    onOpenTransactions: jest.fn(),
    onOpenSupport: jest.fn(),
    onOpenLegal: jest.fn(),
    onCompleteKyc: jest.fn(),
    onSignOut: jest.fn(),
    ...overrides,
  };
}

it('shows who the member is, including their phone number', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.getByText('Chisom Okafor')).toBeTruthy();
  expect(view.getByText('chisom@ajocloud.ng')).toBeTruthy();
  expect(view.getByText('+2348012345678')).toBeTruthy();
});

it('shows the three wallet figures', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.getByText('₦847,320.50')).toBeTruthy();
  expect(view.getByText('₦234,500.00')).toBeTruthy();
  // Twice on purpose: the Rewards tile and the referral card's "earned" are
  // the same figure, and both are read from the released reward total.
  expect(view.getAllByText('₦6,000.00')).toHaveLength(2);
});

it('says a balance is unavailable rather than showing zero', async () => {
  // A wallet that could not be read is not an empty wallet.
  const view = await render(<ProfileMenuScreen {...props({ availableMinor: undefined })} />);
  expect(view.getByText('Unavailable')).toBeTruthy();
});

it('shows the referral code with its invite count and earnings', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.getByText('AJO-CH2SOM')).toBeTruthy();
  expect(view.getByText(/12 invites/)).toBeTruthy();
});

it('copies the referral code', async () => {
  const onCopyReferralCode = jest.fn();
  const view = await render(<ProfileMenuScreen {...props({ onCopyReferralCode })} />);
  await act(async () => fireEvent.press(view.getByLabelText('Copy referral code AJO-CH2SOM')));
  expect(onCopyReferralCode).toHaveBeenCalledWith('AJO-CH2SOM');
});

it('shares the referral code', async () => {
  const onShareReferralCode = jest.fn();
  const view = await render(<ProfileMenuScreen {...props({ onShareReferralCode })} />);
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: 'Invite friends and earn' })),
  );
  expect(onShareReferralCode).toHaveBeenCalledWith('AJO-CH2SOM');
});

it('explains the absence of a code rather than showing an empty box', async () => {
  const view = await render(
    <ProfileMenuScreen
      {...props({
        referrals: {
          totalRewardMinor: '0',
          currency: 'NGN',
          referralCount: 0,
          qualifiedCount: 0,
          code: null,
        },
      })}
    />,
  );
  expect(view.getByText(/referral code will appear here/i)).toBeTruthy();
});

it('marks a fully verified account', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.getByText('KYC Verified')).toBeTruthy();
  expect(view.getByText('Verified')).toBeTruthy();
});

it('names what verification still needs rather than showing a badge', async () => {
  const view = await render(
    <ProfileMenuScreen
      {...props({
        kyc: {
          tier: 'TIER_1',
          status: 'NOT_STARTED',
          steps: {
            personalDetails: { complete: true },
            identity: { complete: false, maskedIdentifier: null, kind: null },
            bankAccount: { complete: false },
          },
        },
      })}
    />,
  );
  expect(view.getByText(/your BVN or NIN, a bank account/)).toBeTruthy();
  expect(view.queryByText('KYC Verified')).toBeNull();
});

describe('appearance', () => {
  it('offers System, Light and Dark', async () => {
    const view = await render(<ProfileMenuScreen {...props()} />);
    expect(view.getByLabelText('System appearance')).toBeTruthy();
    expect(view.getByLabelText('Light appearance')).toBeTruthy();
    expect(view.getByLabelText('Dark appearance')).toBeTruthy();
  });

  it('marks the current choice as selected, not merely coloured', async () => {
    const view = await render(<ProfileMenuScreen {...props({ themePreference: 'dark' })} />);
    expect(view.getByLabelText('Dark appearance').props.accessibilityState.selected).toBe(true);
    expect(view.getByLabelText('System appearance').props.accessibilityState.selected).toBe(false);
  });

  it('changes the preference', async () => {
    const onChangeTheme = jest.fn();
    const view = await render(<ProfileMenuScreen {...props({ onChangeTheme })} />);
    await act(async () => fireEvent.press(view.getByLabelText('Dark appearance')));
    expect(onChangeTheme).toHaveBeenCalledWith('dark');
  });
});

it('opens bank accounts and transaction history', async () => {
  const onOpenBankAccounts = jest.fn();
  const onOpenTransactions = jest.fn();
  const view = await render(
    <ProfileMenuScreen {...props({ onOpenBankAccounts, onOpenTransactions })} />,
  );
  await act(async () => fireEvent.press(view.getByText('Bank Accounts')));
  await act(async () => fireEvent.press(view.getByText('Transaction History')));
  expect(onOpenBankAccounts).toHaveBeenCalledTimes(1);
  expect(onOpenTransactions).toHaveBeenCalledTimes(1);
});

it('shows an unread count on the notifications row', async () => {
  const view = await render(<ProfileMenuScreen {...props({ unreadCount: 3 })} />);
  expect(view.getByText('Notifications (3 new)')).toBeTruthy();
});
