import { useOnboardingStore } from './onboarding-store';

describe('onboarding store', () => {
  beforeEach(() => useOnboardingStore.setState({ completed: false }));

  it('starts incomplete so the introduction shows on first run', () => {
    expect(useOnboardingStore.getState().completed).toBe(false);
  });

  it('marks completion when the carousel is finished or skipped', () => {
    useOnboardingStore.getState().complete();
    expect(useOnboardingStore.getState().completed).toBe(true);
  });

  it('resets on sign-out so the introduction shows again', () => {
    useOnboardingStore.getState().complete();
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().completed).toBe(false);
  });
});
