import { act, fireEvent, render } from '@testing-library/react-native';

import type { ReferralSummary } from '@/api/endpoints/referrals';
import { ReferralScreen } from '@/features/profile/referral-screen';

const summary: ReferralSummary = {
  totalRewardMinor: '600000',
  currency: 'NGN',
  referralCount: 12,
  qualifiedCount: 6,
  code: 'AJO-CH2SOM',
};

function setup(overrides: Partial<React.ComponentProps<typeof ReferralScreen>> = {}) {
  return render(
    <ReferralScreen
      referrals={summary}
      onCopyReferralCode={jest.fn()}
      onShareReferralCode={jest.fn()}
      {...overrides}
    />,
  );
}

it('shows the code with its invite count and earnings', async () => {
  const view = await setup();
  expect(view.getByText('AJO-CH2SOM')).toBeTruthy();
  expect(view.getByText(/12 invites/)).toBeTruthy();
  expect(view.getByText('₦6,000.00')).toBeTruthy();
});

it('copies the referral code', async () => {
  const onCopyReferralCode = jest.fn();
  const view = await setup({ onCopyReferralCode });
  await act(async () => fireEvent.press(view.getByLabelText('Copy referral code AJO-CH2SOM')));
  expect(onCopyReferralCode).toHaveBeenCalledWith('AJO-CH2SOM');
});

it('shares the referral code', async () => {
  const onShareReferralCode = jest.fn();
  const view = await setup({ onShareReferralCode });
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: 'Invite friends and earn' })),
  );
  expect(onShareReferralCode).toHaveBeenCalledWith('AJO-CH2SOM');
});

it('explains the absence of a code rather than showing an empty box', async () => {
  const view = await setup({
    referrals: {
      totalRewardMinor: '0',
      currency: 'NGN',
      referralCount: 0,
      qualifiedCount: 0,
      code: null,
    },
  });
  expect(view.getByText(/referral code will appear here/i)).toBeTruthy();
});
