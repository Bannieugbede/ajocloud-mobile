import { act, fireEvent, render } from '@testing-library/react-native';

import type { AjoSwapRequest } from '@/api/endpoints/ajo-groups';
import { SwapApprovalsScreen } from '@/features/ajo/swap-approvals-screen';
import { toTopicRows } from '@/features/profile/notification-settings';
import { NotificationsScreen } from '@/features/profile/notifications-screen';

const now = new Date('2026-09-02T12:00:00.000Z');

const swap = (overrides: Partial<AjoSwapRequest> = {}): AjoSwapRequest => ({
  id: 'swap-1',
  status: 'PENDING',
  initiatorType: 'MEMBER',
  requestedByMemberId: 'member-bola',
  from: { slotId: 'slot-2', position: 2, memberId: 'member-bola', displayName: 'Bola Adeyemi' },
  to: { slotId: 'slot-1', position: 1, memberId: 'member-ada', displayName: 'Ada Okafor' },
  reason: 'Travelling in March',
  expiresAt: '2026-09-04T12:00:00.000Z',
  decidedAt: null,
  executedAt: null,
  createdAt: '2026-09-01T12:00:00.000Z',
  approvals: [],
  awaitingMyDecision: true,
  ...overrides,
});

describe('SwapApprovalsScreen', () => {
  const setup = async (props: Partial<Parameters<typeof SwapApprovalsScreen>[0]> = {}) =>
    await render(
      <SwapApprovalsScreen
        swaps={[swap()]}
        now={now}
        deciding={null}
        onApprove={jest.fn()}
        onReject={jest.fn()}
        {...props}
      />,
    );

  it('says what a swap would do rather than only naming the members', async () => {
    const view = await setup();
    expect(
      view.getByText('Bola Adeyemi (position 2) and Ada Okafor (position 1) would trade places'),
    ).toBeTruthy();
  });

  it('warns that approving changes when each member is paid', async () => {
    const view = await setup();
    expect(view.getByText(/changes when each of you is\s+paid/i)).toBeTruthy();
  });

  it('offers a decision on a request awaiting this member', async () => {
    const onApprove = jest.fn();
    const view = await setup({ onApprove });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Approve' }));
    });
    expect(onApprove).toHaveBeenCalled();
  });

  it('does not offer a decision on someone else request', async () => {
    const view = await setup({ swaps: [swap({ awaitingMyDecision: false })] });
    expect(view.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect(view.getByText('Waiting for the other member')).toBeTruthy();
  });

  it('withdraws the buttons once the deadline has passed', async () => {
    // The server refuses an expired request, so offering the button would
    // produce an error the member could not have predicted.
    const view = await setup({ swaps: [swap({ expiresAt: '2026-09-02T11:00:00.000Z' })] });
    expect(view.queryByRole('button', { name: 'Approve' })).toBeNull();
  });

  it('explains an empty list rather than showing a blank screen', async () => {
    const view = await setup({ swaps: [] });
    expect(view.getByText('No swap requests')).toBeTruthy();
  });

  it('surfaces a failed decision', async () => {
    const view = await setup({
      error: { message: 'A conflicting swap request already exists' } as never,
    });
    expect(view.getByText('A conflicting swap request already exists')).toBeTruthy();
  });
});

describe('NotificationsScreen', () => {
  const setup = async (props: Partial<Parameters<typeof NotificationsScreen>[0]> = {}) =>
    await render(
      <NotificationsScreen
        rows={toTopicRows([])}
        quietWindow={null}
        timezone="Africa/Lagos"
        saving={false}
        saved={false}
        onToggle={jest.fn()}
        onQuietHours={jest.fn()}
        {...props}
      />,
    );

  it('labels each channel switch for a screen reader', async () => {
    const view = await setup();
    expect(view.getByLabelText('Ajo payouts by email')).toBeTruthy();
    expect(view.getByLabelText('Ajo payouts by SMS')).toBeTruthy();
  });

  it('reports a change for one channel only', async () => {
    const onToggle = jest.fn();
    const view = await setup({ onToggle });
    await act(async () => {
      fireEvent(view.getByLabelText('Ajo payouts by SMS'), 'valueChange', false);
    });
    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ topic: 'ajo.payout' }),
      'SMS',
      false,
    );
  });

  it('says security messages are always sent, rather than leaving it to be inferred', async () => {
    const view = await setup();
    expect(view.getByText(/always\s+sent/i)).toBeTruthy();
  });

  it('names the timezone quiet hours are measured in', async () => {
    const view = await setup();
    expect(view.getByText(/Africa\/Lagos time/)).toBeTruthy();
  });

  it('applies a preset quiet window', async () => {
    const onQuietHours = jest.fn();
    const view = await setup({ onQuietHours });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: '22:00 to 07:00' }));
    });
    expect(onQuietHours).toHaveBeenCalledWith({ startMinutes: 1320, endMinutes: 420 });
  });

  it('confirms a save', async () => {
    const view = await setup({ saved: true });
    expect(view.getByText('Your notification settings have been saved.')).toBeTruthy();
  });
});
