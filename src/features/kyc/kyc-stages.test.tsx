import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { getKycStatus, type KycStatus } from '@/api/endpoints/kyc';

import { KycGate } from './kyc-gate';
import { canPerform, lockedMessage, requiredStage } from './kyc-stages';
import { VerificationScreen, nextRequirement } from './verification-screen';

jest.mock('@/api/endpoints/kyc', () => ({ getKycStatus: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

function status(level: 0 | 1 | 2 | 3, overrides: Partial<KycStatus> = {}): KycStatus {
  const stage = (n: 1 | 2 | 3) =>
    ({
      stage: n,
      title: ['Account', 'Identity', 'Address'][n - 1] ?? '',
      status: n <= level ? 'complete' : n === level + 1 ? 'in_progress' : 'locked',
      requirements:
        n === 2
          ? [
              { key: 'pin', label: 'Set your transaction PIN', state: 'complete' },
              { key: 'nin', label: 'Verify your NIN', state: n <= level ? 'complete' : 'missing' },
            ]
          : [
              {
                key: 'basicInfo',
                label: 'Add details',
                state: n <= level ? 'complete' : 'missing',
              },
            ],
      unlocks: [`Stage ${n} things`],
    }) as const;
  return {
    level,
    currentStage: level === 3 ? null : ((level + 1) as 1 | 2 | 3),
    restricted: false,
    stages: [stage(1), stage(2), stage(3)],
    tier: 'TIER_1',
    status: 'PENDING',
    steps: {
      personalDetails: { complete: level >= 1 },
      identity: { complete: level >= 2, maskedIdentifier: null, kind: null },
      bankAccount: { complete: false },
    },
    ...overrides,
  } as KycStatus;
}

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('stage rules', () => {
  it('lets stage 1 join and pay, but not withdraw or create', () => {
    expect(canPerform('ajo.join', status(1))).toBe(true);
    expect(canPerform('payment', status(1))).toBe(true);
    expect(canPerform('withdrawal', status(1))).toBe(false);
    expect(canPerform('withdrawal', status(2))).toBe(true);
    expect(canPerform('ajo.create', status(2))).toBe(false);
    expect(canPerform('ajo.create', status(3))).toBe(true);
  });

  it('refuses everything once verification is rejected', () => {
    expect(canPerform('ajo.join', status(3, { restricted: true }))).toBe(false);
    expect(lockedMessage('ajo.join', status(3, { restricted: true }))).toMatch(/not approved/);
  });

  it('prefers the table the server sent', () => {
    const custom = status(1, { actions: { withdrawal: 3 } as KycStatus['actions'] });
    expect(requiredStage('withdrawal', custom)).toBe(3);
    expect(requiredStage('withdrawal')).toBe(2);
  });

  it('gates nothing against a server without stages, which enforces none', () => {
    const legacy = status(0);
    delete legacy.level;
    expect(canPerform('ajo.create', legacy)).toBe(true);
  });

  it('names the stage and the action', () => {
    expect(lockedMessage('withdrawal', status(1))).toBe(
      'Complete stage 2 (Identity) verification to withdraw.',
    );
  });
});

describe('KycGate', () => {
  it('shows the screen once the stage is reached', async () => {
    jest.mocked(getKycStatus).mockResolvedValue(status(3));
    const view = await render(
      <KycGate action="ajo.create">
        <Text>Create form</Text>
      </KycGate>,
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(view.getByText('Create form')).toBeTruthy());
    await view.unmount();
  });

  it('explains the missing stage and leads to verification instead', async () => {
    jest.mocked(getKycStatus).mockResolvedValue(status(1));
    const view = await render(
      <KycGate action="ajo.create">
        <Text>Create form</Text>
      </KycGate>,
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(view.getByText('Stage 3 (Address) required')).toBeTruthy());
    expect(view.queryByText('Create form')).toBeNull();
    await fireEvent.press(view.getByRole('button', { name: 'Continue verification' }));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/profile/verification');
    await view.unmount();
  });
});

describe('VerificationScreen', () => {
  it('says which stage the member is on and offers the next step', async () => {
    const onOpen = jest.fn();
    const view = await render(
      <VerificationScreen
        status={status(1)}
        refreshing={false}
        onRefresh={jest.fn()}
        onOpen={onOpen}
      />,
    );
    expect(view.getByText('You are on stage 2 of 3')).toBeTruthy();
    expect(view.getByText('1 of 3 stages complete')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Verify NIN' }));
    expect(onOpen).toHaveBeenCalledWith('nin');
    await view.unmount();
  });

  it('offers nothing for a stage that is locked or waiting on review', () => {
    const view = status(1);
    expect(nextRequirement(view.stages![2]!)).toBeNull();
    expect(nextRequirement({ ...view.stages![1]!, status: 'under_review' })).toBeNull();
  });
});
