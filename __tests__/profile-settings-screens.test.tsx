import { act, fireEvent, render } from '@testing-library/react-native';

import { AppearanceScreen } from '@/features/profile/appearance-screen';
import { PlatformFeesScreen } from '@/features/profile/platform-fees-screen';
import { SettingsScreen } from '@/features/profile/settings-screen';

describe('Settings', () => {
  function props(overrides: Partial<React.ComponentProps<typeof SettingsScreen>> = {}) {
    return {
      unreadCount: 0,
      onEditProfile: jest.fn(),
      onOpenSecurity: jest.fn(),
      onOpenNotifications: jest.fn(),
      onOpenInbox: jest.fn(),
      onOpenLegal: jest.fn(),
      ...overrides,
    };
  }

  it('keeps every row the profile screen no longer shows reachable', async () => {
    // These moved off Profile to match the design. If any of them lost its row
    // here, the screen behind it would become unreachable from the app.
    const view = await render(<SettingsScreen {...props()} />);
    expect(view.getByText('Edit profile')).toBeTruthy();
    expect(view.getByText('Security')).toBeTruthy();
    expect(view.getByText('Notification settings')).toBeTruthy();
    expect(view.getByText('Inbox')).toBeTruthy();
    expect(view.getByText('Privacy and terms')).toBeTruthy();
  });

  it('shows an unread count on the inbox row', async () => {
    // Carried by a badge rather than the row's title, so the row still reads
    // "Inbox" and the count is not buried inside the label a member scans for.
    const view = await render(<SettingsScreen {...props({ unreadCount: 3 })} />);
    expect(view.getByText('Inbox')).toBeTruthy();
    expect(view.getByText('3 new')).toBeTruthy();
  });

  it('does not print a count when there is nothing unread', async () => {
    // An empty badge trains people to ignore the one that means something.
    const view = await render(<SettingsScreen {...props()} />);
    expect(view.getByText('Inbox')).toBeTruthy();
    expect(view.queryByText(/\bnew\b/)).toBeNull();
  });

  it('opens each destination', async () => {
    const handlers = {
      onEditProfile: jest.fn(),
      onOpenSecurity: jest.fn(),
      onOpenNotifications: jest.fn(),
      onOpenInbox: jest.fn(),
      onOpenLegal: jest.fn(),
    };
    const view = await render(<SettingsScreen {...props(handlers)} />);

    await act(async () => fireEvent.press(view.getByText('Edit profile')));
    await act(async () => fireEvent.press(view.getByText('Security')));
    await act(async () => fireEvent.press(view.getByText('Notification settings')));
    await act(async () => fireEvent.press(view.getByText('Inbox')));
    await act(async () => fireEvent.press(view.getByText('Privacy and terms')));

    for (const handler of Object.values(handlers)) {
      expect(handler).toHaveBeenCalledTimes(1);
    }
  });
});

describe('Appearance', () => {
  it('offers System, Light and Dark', async () => {
    // The three-way choice moved here from Profile rather than being reduced to
    // a two-state switch, which would have lost System entirely.
    const view = await render(<AppearanceScreen preference="system" onChange={jest.fn()} />);
    expect(view.getByLabelText('System. Follow your phone’s setting')).toBeTruthy();
    expect(view.getByLabelText('Light. Always light')).toBeTruthy();
    expect(view.getByLabelText('Dark. Always dark')).toBeTruthy();
  });

  it('marks the current choice as selected, not merely coloured', async () => {
    const view = await render(<AppearanceScreen preference="dark" onChange={jest.fn()} />);
    expect(view.getByLabelText('Dark. Always dark').props.accessibilityState.selected).toBe(true);
    expect(
      view.getByLabelText('System. Follow your phone’s setting').props.accessibilityState.selected,
    ).toBe(false);
  });

  it('changes the preference', async () => {
    const onChange = jest.fn();
    const view = await render(<AppearanceScreen preference="system" onChange={onChange} />);
    await act(async () => fireEvent.press(view.getByLabelText('Dark. Always dark')));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});

describe('Platform fees', () => {
  it('states plainly that nothing is charged while every line is free', async () => {
    // The backend charges nothing today. Printing an invented fee table on a
    // financial screen would be worse than printing none.
    const view = await render(<PlatformFeesScreen />);
    expect(view.getByText('Ajo Cloud is free to use')).toBeTruthy();
  });

  it('lists every product a member could expect to be charged for', async () => {
    const view = await render(<PlatformFeesScreen />);
    expect(view.getByText('Contributions and payouts')).toBeTruthy();
    expect(view.getByText('Savings goals and group pools')).toBeTruthy();
    expect(view.getByText('Package subscriptions')).toBeTruthy();
    expect(view.getByText('Airtime, data, electricity and TV')).toBeTruthy();
    expect(view.getByText('Funding and withdrawals')).toBeTruthy();
  });

  it("says a bank's own charge is not ours", async () => {
    const view = await render(<PlatformFeesScreen />);
    expect(view.getByText(/Those charges are theirs, not ours/)).toBeTruthy();
  });
});
