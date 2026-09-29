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

it('shows no wallet figures on the menu', async () => {
  // Balances live on the Wallet screens; the menu keeps navigation rows, so
  // figures here would duplicate them and go stale independently.
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.queryByText('Wallet Summary')).toBeNull();
  expect(view.queryByText('Available to spend')).toBeNull();
  expect(view.queryByText('Across Akawo goals')).toBeNull();
  expect(view.queryByText('Referral earnings')).toBeNull();
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

it('shows one verification CTA whatever the level, naming what is still needed', async () => {
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
  expect(view.getByTestId('kyc-cta-card')).toBeTruthy();
  expect(view.getByText('Complete your KYC verification')).toBeTruthy();
  expect(view.getByText(/Still needed:.*your NIN/)).toBeTruthy();
  expect(view.getByRole('button', { name: 'Continue verification' })).toBeTruthy();
  expect(view.queryByLabelText('KYC Verified')).toBeNull();
});

it('keeps the same CTA heading at a higher stage', async () => {
  const view = await render(
    <ProfileMenuScreen
      {...props({
        kyc: {
          tier: 'TIER_1',
          status: 'PENDING',
          level: 1,
          currentStage: 2,
          stages: [
            {
              stage: 2,
              title: 'Identity',
              status: 'in_progress',
              requirements: [{ key: 'nin', label: 'Verify NIN', state: 'missing' }],
              unlocks: ['Withdrawals'],
            },
          ],
          steps: {
            personalDetails: { complete: true },
            identity: { complete: false, maskedIdentifier: null, kind: null },
            bankAccount: { complete: false },
          },
        },
      })}
    />,
  );
  // Same heading no matter the level; the stage sits underneath as context.
  expect(view.getByText('Complete your KYC verification')).toBeTruthy();
  expect(view.getByText('Stage 2 of 3')).toBeTruthy();
  expect(view.getByText(/Still needed:.*verify NIN/)).toBeTruthy();
});

it('offers to start verification when no KYC status has loaded', async () => {
  const { kyc: _dropped, ...withoutKyc } = props();
  const view = await render(<ProfileMenuScreen {...withoutKyc} />);
  expect(view.getByTestId('kyc-cta-card')).toBeTruthy();
  expect(view.getByText('Complete your KYC verification')).toBeTruthy();
  expect(view.getByRole('button', { name: 'Start verification' })).toBeTruthy();
});

it('hides the CTA once fully verified', async () => {
  const view = await render(<ProfileMenuScreen {...props()} />);
  expect(view.queryByTestId('kyc-cta-card')).toBeNull();
});

it('opens verification from the CTA button', async () => {
  const onCompleteKyc = jest.fn();
  const view = await render(
    <ProfileMenuScreen
      {...props({
        onCompleteKyc,
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
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: 'Continue verification' })),
  );
  expect(onCompleteKyc).toHaveBeenCalledTimes(1);
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
