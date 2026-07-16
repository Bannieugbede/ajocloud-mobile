import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { IntroductionScreen } from '@/features/onboarding/introduction-screen';
import {
  hasCompletedIntroduction,
  markIntroductionComplete,
} from '@/services/onboarding-preferences';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('pages through the local introduction and persists completion', async () => {
  const onComplete = jest.fn();
  const view = await render(<IntroductionScreen onComplete={onComplete} />);

  expect(view.getByText('1 of 3')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Next' }));
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  expect(view.getByText('2 of 3')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Next' }));
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
  expect(view.getByText('3 of 3')).toBeTruthy();
  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Get started' }));
  });

  await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  expect(await hasCompletedIntroduction()).toBe(true);
});

it('persists completion through the reusable preference boundary', async () => {
  expect(await hasCompletedIntroduction()).toBe(false);
  await markIntroductionComplete();
  expect(await hasCompletedIntroduction()).toBe(true);
});

it('announces a recoverable error when local completion cannot be saved', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('storage unavailable'));
  const view = await render(<IntroductionScreen onComplete={jest.fn()} />);

  await act(async () => {
    fireEvent.press(view.getByRole('button', { name: 'Skip introduction' }));
  });

  expect(
    view.getByText('We could not save your introduction progress. Please try again.'),
  ).toBeTruthy();
});
