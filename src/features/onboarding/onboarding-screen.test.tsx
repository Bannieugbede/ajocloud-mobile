import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingScreen } from './onboarding-screen';
import { onboardingSlides } from './onboarding-slides';

// The screen reads safe-area insets, which require the provider and a measured frame.
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderScreen = async (ui: ReactElement) =>
  await render(<SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>);

describe('OnboardingScreen', () => {
  it('opens on the first slide and reports its position', async () => {
    const view = await renderScreen(<OnboardingScreen onDone={jest.fn()} />);
    expect(view.getByText(onboardingSlides[0].titleLead)).toBeTruthy();
    expect(view.getByTestId('onboarding-progress').props.accessibilityLabel).toBe(
      `Step 1 of ${onboardingSlides.length}`,
    );
  });

  it('renders every slide so the carousel can be swiped end to end', async () => {
    const view = await renderScreen(<OnboardingScreen onDone={jest.fn()} />);
    for (const slide of onboardingSlides) {
      expect(view.getByText(slide.titleLead)).toBeTruthy();
      expect(view.getByText(slide.caption)).toBeTruthy();
    }
  });

  it('exposes paging controls as accessible buttons', async () => {
    const view = await renderScreen(<OnboardingScreen onDone={jest.fn()} />);
    expect(view.getByRole('button', { name: 'Skip introduction' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Next slide' })).toBeTruthy();
  });

  it('completes the flow when skipped', async () => {
    const onDone = jest.fn();
    const view = await renderScreen(<OnboardingScreen onDone={onDone} />);
    fireEvent.press(view.getByRole('button', { name: 'Skip introduction' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not finish the flow while earlier slides remain', async () => {
    const onDone = jest.fn();
    const view = await renderScreen(<OnboardingScreen onDone={onDone} />);
    fireEvent.press(view.getByRole('button', { name: 'Next slide' }));
    expect(onDone).not.toHaveBeenCalled();
  });
});
