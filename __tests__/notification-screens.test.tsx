import { act, fireEvent, render } from '@testing-library/react-native';

import type { InAppNotification } from '@/api/endpoints/notifications';
import { NotificationsInboxScreen } from '@/features/notifications/notifications-inbox-screen';

const now = new Date(2026, 8, 3, 12, 0, 0);

const notification = (overrides: Partial<InAppNotification> = {}): InAppNotification => ({
  id: 'n-1',
  template: 'ajo-payout-sent',
  title: 'Your payout was sent',
  body: '₦50,000 was sent for your Owo Ise payout.',
  deepLink: '/(tabs)/ajo',
  readAt: null,
  createdAt: now.toISOString(),
  ...overrides,
});

describe('NotificationsInboxScreen', () => {
  const setup = async (props: Partial<Parameters<typeof NotificationsInboxScreen>[0]> = {}) =>
    await render(
      <NotificationsInboxScreen
        notifications={[notification()]}
        unreadCount={1}
        now={now}
        refreshing={false}
        onRefresh={jest.fn()}
        onOpen={jest.fn()}
        onMarkAllRead={jest.fn()}
        {...props}
      />,
    );

  it('shows what happened, not just that something did', async () => {
    const view = await setup();
    expect(view.getByText('Your payout was sent')).toBeTruthy();
    expect(view.getByText('₦50,000 was sent for your Owo Ise payout.')).toBeTruthy();
  });

  it('marks unread with a word, not colour alone', async () => {
    const view = await setup();
    expect(view.getByText('New')).toBeTruthy();
  });

  it('tells a screen reader which entries are unread', async () => {
    const view = await setup();
    expect(view.getByLabelText('Your payout was sent, unread')).toBeTruthy();
  });

  it('drops the unread marker once read', async () => {
    const view = await setup({
      notifications: [notification({ readAt: now.toISOString() })],
      unreadCount: 0,
    });
    expect(view.queryByText('New')).toBeNull();
  });

  it('opens a notification when tapped', async () => {
    const onOpen = jest.fn();
    const view = await setup({ onOpen });
    await act(async () => {
      fireEvent.press(view.getByLabelText('Your payout was sent, unread'));
    });
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'n-1' }));
  });

  it('offers mark-all only when something is unread', async () => {
    const withUnread = await setup();
    expect(withUnread.getByRole('button', { name: 'Mark all as read' })).toBeTruthy();

    const allRead = await setup({ unreadCount: 0 });
    expect(allRead.queryByRole('button', { name: 'Mark all as read' })).toBeNull();
  });

  it('groups by day rather than listing raw timestamps', async () => {
    const view = await setup({
      notifications: [
        notification({ id: 'a' }),
        notification({ id: 'b', createdAt: new Date(2026, 8, 2, 9, 0, 0).toISOString() }),
      ],
      unreadCount: 2,
    });
    expect(view.getByText('TODAY')).toBeTruthy();
    expect(view.getByText('YESTERDAY')).toBeTruthy();
  });

  it('explains an empty inbox rather than showing a blank screen', async () => {
    const view = await setup({ notifications: [], unreadCount: 0 });
    expect(view.getByText('Nothing yet')).toBeTruthy();
  });
});

describe('the notification inbox, rebuilt', () => {
  const setup = async (props: Partial<Parameters<typeof NotificationsInboxScreen>[0]> = {}) =>
    await render(
      <NotificationsInboxScreen
        notifications={[notification()]}
        unreadCount={1}
        now={now}
        refreshing={false}
        onRefresh={jest.fn()}
        onOpen={jest.fn()}
        onMarkAllRead={jest.fn()}
        {...props}
      />,
    );

  it('summarises the unread count in the header', async () => {
    const view = await setup({ unreadCount: 3 });
    expect(view.getByText('3 unread')).toBeTruthy();
  });

  it('says the inbox is caught up rather than reporting zero', async () => {
    const view = await setup({
      notifications: [notification({ readAt: now.toISOString() })],
      unreadCount: 0,
    });
    expect(view.getByText('You are all caught up')).toBeTruthy();
  });

  it('offers older notifications when the feed has more pages', async () => {
    // The feed returns a cursor and the screen ignored it, so anything past the
    // first page was unreachable.
    const onLoadMore = jest.fn();
    const view = await setup({ hasMore: true, onLoadMore });

    await act(async () => fireEvent.press(view.getByText('Show older')));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('hides the older control when there is nothing more to fetch', async () => {
    const view = await setup({ hasMore: false, onLoadMore: jest.fn() });
    expect(view.queryByText('Show older')).toBeNull();
  });

  it('offers a retry when the feed could not be loaded', async () => {
    const onRetry = jest.fn();
    const view = await setup({ notifications: [], unreadCount: 0, error: true, onRetry });

    await act(async () => fireEvent.press(view.getByText('Try again')));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state rather than a blank screen', async () => {
    const view = await setup({ notifications: [], unreadCount: 0 });
    expect(view.getByText('Nothing yet')).toBeTruthy();
  });

  it('does not claim the inbox is empty while it is still loading', async () => {
    // An empty state shown during the first fetch tells the member they have
    // nothing, a moment before their notifications appear.
    const view = await setup({ notifications: [], unreadCount: 0, loading: true });
    expect(view.queryByText('Nothing yet')).toBeNull();
    expect(view.getByTestId('notifications-skeleton')).toBeTruthy();
  });

  it('opens notification settings from the header', async () => {
    const onOpenSettings = jest.fn();
    const view = await setup({ onOpenSettings });

    await act(async () => fireEvent.press(view.getByLabelText('Notification settings')));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
