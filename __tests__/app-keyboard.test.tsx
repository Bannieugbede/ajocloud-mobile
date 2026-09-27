import { act, fireEvent, render } from '@testing-library/react-native';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { Text } from 'react-native';

import { AppBottomSheet } from '@/components/ui/app-bottom-sheet';
import {
  AppKeyboardAvoidingView,
  AppKeyboardScrollView,
  keyboardOffset,
} from '@/components/ui/app-keyboard';

describe('keeping inputs clear of the keyboard', () => {
  it('offsets by the native header the screen sits under, on iOS', () => {
    // Without this the content is lifted short by the header's height and the
    // last field stays behind the keyboard.
    expect(keyboardOffset({ platform: 'ios', headerHeight: 96 })).toBe(96);
    expect(keyboardOffset({ platform: 'ios', headerHeight: 96, offset: 12 })).toBe(108);
  });

  it('adds no header offset in a modal, which sits outside the header', () => {
    expect(keyboardOffset({ platform: 'ios', headerHeight: 96, ignoreHeader: true })).toBe(0);
  });

  it('adds nothing on Android, which measures from the keyboard’s own origin', () => {
    expect(keyboardOffset({ platform: 'android', headerHeight: 96 })).toBe(0);
  });

  it('renders under a header and without one', async () => {
    const withHeader = await render(
      <HeaderHeightContext.Provider value={96}>
        <AppKeyboardAvoidingView>
          <Text>Form</Text>
        </AppKeyboardAvoidingView>
      </HeaderHeightContext.Provider>,
    );
    expect(withHeader.getByText('Form')).toBeTruthy();
    const without = await render(
      <AppKeyboardAvoidingView>
        <Text>Bare</Text>
      </AppKeyboardAvoidingView>,
    );
    expect(without.getByText('Bare')).toBeTruthy();
  });

  it('keeps a footer outside the scroll, where it rises with the keyboard', async () => {
    const view = await render(
      <AppKeyboardScrollView footer={<Text>Continue</Text>}>
        <Text>Fields</Text>
      </AppKeyboardScrollView>,
    );
    expect(view.getByText('Fields')).toBeTruthy();
    expect(view.getByText('Continue')).toBeTruthy();
  });

  it('lets buttons be tapped while the keyboard is up', async () => {
    const view = await render(
      <AppKeyboardScrollView testID="form">
        <Text>Fields</Text>
      </AppKeyboardScrollView>,
    );
    expect(view.getByTestId('form').props.keyboardShouldPersistTaps).toBe('handled');
  });
});

describe('AppBottomSheet', () => {
  const setup = async (onClose = jest.fn()) =>
    await render(
      <AppBottomSheet visible title="Pick an option" onClose={onClose}>
        <Text>Contents</Text>
      </AppBottomSheet>,
    );

  it('shows its title and contents', async () => {
    const view = await setup();
    expect(view.getByText('Pick an option')).toBeTruthy();
    expect(view.getByText('Contents')).toBeTruthy();
  });

  it('closes from the button and from the backdrop', async () => {
    const onClose = jest.fn();
    const view = await setup(onClose);
    await act(async () => fireEvent.press(view.getByLabelText('Close')));
    await act(async () => fireEvent.press(view.getByLabelText('Close pick an option')));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
