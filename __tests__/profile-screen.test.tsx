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
    onOpenSettings: jest.fn(),
    onOpenBankAccounts: jest.fn(),
    onOpenReferrals: jest.fn(),
    onOpenTransactions: jest.fn(),
    onOpenAppearance: jest.fn(),
    onOpenFees: jest.fn(),
    onOpenSupport: jest.fn(),
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
  // The Rewards tile reads the released reward total; the code and its
  // earnings live on the Referrals screen now.
  expect(view.getAllByText('₦6,000.00')).toHaveLength(1);
});

it('names each wallet figure for what it is', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.getByText('Wallet Summary')).toBeTruthy();
  expect(view.getByText('Available to spend')).toBeTruthy();
  expect(view.getByText('Across Akawo goals')).toBeTruthy();
  expect(view.getByText('Referral earnings')).toBeTruthy();
});

it('says a balance is unavailable rather than showing zero', async () => {
  // A wallet that could not be read is not an empty wallet.
  const view = await render(<ProfileMenuScreen {...props({ availableMinor: undefined })} />);
  expect(view.getByText('Unavailable')).toBeTruthy();
});

it('opens referrals from the menu row', async () => {
  const onOpenReferrals = jest.fn();
  const view = await render(<ProfileMenuScreen {...props({ onOpenReferrals })} />);
  expect(view.getByText(/12 invites/)).toBeTruthy();
  await act(async () => fireEvent.press(view.getByText('Referrals')));
  expect(onOpenReferrals).toHaveBeenCalledTimes(1);
});

it('marks a fully verified account', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.getByLabelText('KYC Verified')).toBeTruthy();
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
  expect(view.queryByLabelText('KYC Verified')).toBeNull();
});

describe('the Dark Mode row', () => {
  it('says the phone is being followed while the preference is System', async () => {
    // "System" is the default, and a row that said nothing would leave someone
    // wondering why the app changed colour at dusk.
    const view = await render(<ProfileMenuScreen {...props()} />);
    expect(view.getByText('Following your phone')).toBeTruthy();
  });

  it('says whether dark mode is on once a mode has been chosen', async () => {
    const dark = await render(<ProfileMenuScreen {...props({ themePreference: 'dark' })} />);
    expect(dark.getByText('On')).toBeTruthy();

    const light = await render(<ProfileMenuScreen {...props({ themePreference: 'light' })} />);
    expect(light.getByText('Off')).toBeTruthy();
  });

  it('opens the appearance screen rather than changing the theme in place', async () => {
    const onOpenAppearance = jest.fn();
    const view = await render(<ProfileMenuScreen {...props({ onOpenAppearance })} />);
    await act(async () => fireEvent.press(view.getByText('Dark Mode')));
    expect(onOpenAppearance).toHaveBeenCalledTimes(1);
  });
});

describe('the rows the design keeps on this screen', () => {
  it('opens the fee schedule', async () => {
    const onOpenFees = jest.fn();
    const view = await render(<ProfileMenuScreen {...props({ onOpenFees })} />);
    await act(async () => fireEvent.press(view.getByText('Platform Fees')));
    expect(onOpenFees).toHaveBeenCalledTimes(1);
  });

  it('opens support from the Help row', async () => {
    const onOpenSupport = jest.fn();
    const view = await render(<ProfileMenuScreen {...props({ onOpenSupport })} />);
    await act(async () => fireEvent.press(view.getByText('Help & Support')));
    expect(onOpenSupport).toHaveBeenCalledTimes(1);
  });

  it('opens settings from the header gear', async () => {
    // Edit profile, Security, Notifications and Legal live behind this, so a
    // gear that did nothing would strand all four.
    const onOpenSettings = jest.fn();
    const view = await render(<ProfileMenuScreen {...props({ onOpenSettings })} />);
    await act(async () => fireEvent.press(view.getByLabelText('Settings')));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
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

it('confirms before signing out', async () => {
  const onSignOut = jest.fn();
  const view = await render(<ProfileMenuScreen {...props({ onSignOut })} />);

  // The row only asks; nothing leaves until the dialog confirms.
  await act(async () => fireEvent.press(view.getByTestId('sign-out-row')));
  expect(onSignOut).not.toHaveBeenCalled();
  expect(view.getByText('Sign out?')).toBeTruthy();

  await act(async () => fireEvent.press(view.getByTestId('sign-out-confirm')));
  expect(onSignOut).toHaveBeenCalledTimes(1);
  expect(view.queryByText('Sign out?')).toBeNull();
});

it('cancels signing out without leaving', async () => {
  const onSignOut = jest.fn();
  const view = await render(<ProfileMenuScreen {...props({ onSignOut })} />);

  await act(async () => fireEvent.press(view.getByTestId('sign-out-row')));
  await act(async () => fireEvent.press(view.getByText('Cancel')));
  expect(onSignOut).not.toHaveBeenCalled();
  expect(view.queryByText('Sign out?')).toBeNull();
});

it('says it is signing out rather than looking unresponsive', async () => {
  const view = await render(<ProfileMenuScreen {...props({ signingOut: true })} />);
  expect(view.getByText('Signing out…')).toBeTruthy();
});
