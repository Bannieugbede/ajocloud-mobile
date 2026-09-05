import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreenHeader } from '@/components/ui/app-screen-header';

/** Resolves the style array a Pressable receives into one object. */
function flatten(style: unknown): Record<string, unknown> {
  const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
  return (StyleSheet.flatten(resolved) ?? {}) as Record<string, unknown>;
}

it('reads its title as a heading', async () => {
  const view = await render(<AppScreenHeader title="My Ajo Groups" />);
  expect(view.getByRole('header', { name: 'My Ajo Groups' })).toBeTruthy();
});

it('shows an eyebrow and a subtitle when given them', async () => {
  const view = await render(
    <AppScreenHeader eyebrow="Good morning" title="Chisom Okafor" subtitle="4 active groups" />,
  );
  expect(view.getByText('Good morning')).toBeTruthy();
  expect(view.getByText('4 active groups')).toBeTruthy();
});

it('omits the subtitle rather than leaving an empty line', async () => {
  const view = await render(<AppScreenHeader title="Profile" />);
  expect(view.queryByText('')).toBeNull();
});

it('names every icon button, since an icon announces nothing on its own', async () => {
  const onPress = jest.fn();
  const view = await render(
    <AppScreenHeader
      title="Home"
      actions={[{ icon: 'notifications-outline', label: 'Notifications, 3 unread', onPress }]}
    />,
  );

  await act(async () => fireEvent.press(view.getByLabelText('Notifications, 3 unread')));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('renders inline actions beside the title', async () => {
  const onCreate = jest.fn();
  const view = await render(
    <AppScreenHeader title="Akawo" subtitle="Group pool collection">
      <AppButton label="Create" onPress={onCreate} />
    </AppScreenHeader>,
  );

  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Create' })));
  expect(onCreate).toHaveBeenCalledTimes(1);
});

describe('header sizing', () => {
  it('keeps a compact button reachable at the full touch target', async () => {
    // The compact size shrinks the drawn box so a pair of buttons does not
    // crowd the title beside them. The tappable area must not shrink with it:
    // hitSlop puts back the height the smaller padding gives up.
    const view = await render(<AppButton label="Join" size="compact" onPress={() => {}} />);
    const button = view.getByRole('button');

    const slop = button.props.hitSlop as { top: number; bottom: number };
    const height = flatten(button.props.style).minHeight as number;

    expect(height + slop.top + slop.bottom).toBeGreaterThanOrEqual(48);
  });

  it('leaves a default button at the full touch target without slop', async () => {
    const view = await render(<AppButton label="Continue" onPress={() => {}} />);
    const button = view.getByRole('button');

    expect(flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(48);
  });

  it('keeps a header icon button reachable despite its smaller circle', async () => {
    const view = await render(
      <AppScreenHeader
        title="Ajo"
        actions={[{ icon: 'notifications-outline', label: 'Notifications', onPress: () => {} }]}
      />,
    );
    const button = view.getByLabelText('Notifications');

    const slop = button.props.hitSlop as number;
    const height = flatten(button.props.style).height as number;

    expect(height + slop * 2).toBeGreaterThanOrEqual(48);
  });
});
