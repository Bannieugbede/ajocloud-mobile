import { fireEvent, render } from '@testing-library/react-native';

import { AppButton } from '@/components/ui/app-button';

it('exposes an accessible button and invokes its action', async () => {
  const onPress = jest.fn();
  const view = await render(<AppButton label="Continue" onPress={onPress} />);
  fireEvent.press(view.getByRole('button', { name: 'Continue' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
