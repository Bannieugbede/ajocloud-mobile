import { act, fireEvent, render } from '@testing-library/react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreenHeader } from '@/components/ui/app-screen-header';

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
