import { act, fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { CrashScreen } from '@/features/errors/crash-screen';

/** Throws on its first render, then behaves once told to stop. */
function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('kaboom: token=SECRET account=0123456789');
  return <Text>Recovered</Text>;
}

describe('the crash screen', () => {
  const setup = async (props: Partial<Parameters<typeof CrashScreen>[0]> = {}) =>
    await render(
      <CrashScreen
        reference="ERR-ABC234"
        onRetry={jest.fn()}
        onReload={jest.fn()}
        canReload={false}
        {...props}
      />,
    );

  it('reassures the member about their money before anything else', async () => {
    // Someone whose banking app has just broken in front of them assumes the
    // worst about their balance first. Saying nothing invites that.
    const view = await setup();
    expect(view.getByText(/Your\s+money and your savings are safe/)).toBeTruthy();
  });

  it('shows a reference the member can quote', async () => {
    const view = await setup();
    expect(view.getByText('ERR-ABC234')).toBeTruthy();
  });

  it('offers a retry', async () => {
    const onRetry = jest.fn();
    const view = await setup({ onRetry });
    await act(async () => fireEvent.press(view.getByLabelText('Try again')));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('withholds the restart until retrying has already failed once', async () => {
    // A crash during first render repeats on a plain remount, so offering both
    // at once asks the member to guess which one is the real recovery.
    const view = await setup({ canReload: false });
    expect(view.queryByLabelText('Restart the app')).toBeNull();
  });

  it('offers the restart once retrying has failed', async () => {
    const onReload = jest.fn();
    const view = await setup({ canReload: true, onReload });
    await act(async () => fireEvent.press(view.getByLabelText('Restart the app')));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('announces itself to a screen reader as an alert', async () => {
    // Assertive rather than polite: the member needs to know the screen changed
    // under them, not to hear it after whatever else was being read.
    const view = await setup({ testID: 'crash' });
    const root = view.getByTestId('crash');
    expect(root.props.accessibilityRole).toBe('alert');
    expect(root.props.accessibilityLiveRegion).toBe('assertive');
  });
});

describe('the error boundary', () => {
  // React logs a caught render error; silenced so the run stays readable.
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => consoleError.mockRestore());

  it('catches a render failure instead of taking the app down', async () => {
    const view = await render(
      <AppErrorBoundary>
        <Bomb explode />
      </AppErrorBoundary>,
    );
    expect(view.getByText('Something went wrong')).toBeTruthy();
  });

  it('never shows the error itself, which can carry secrets', async () => {
    // A stack trace holds whatever the code had in scope. This screen is the
    // one place guaranteed to be seen without the member being asked first.
    const view = await render(
      <AppErrorBoundary>
        <Bomb explode />
      </AppErrorBoundary>,
    );
    expect(view.queryByText(/SECRET/)).toBeNull();
    expect(view.queryByText(/0123456789/)).toBeNull();
    expect(view.queryByText(/kaboom/)).toBeNull();
  });

  it('recovers when the retry succeeds', async () => {
    // The old boundary said "close the app and try again" and offered nothing,
    // so one bad render bricked the app until it was force-quit.
    function Harness() {
      const [explode, setExplode] = useState(true);
      return (
        <>
          <Text onPress={() => setExplode(false)}>Defuse</Text>
          <AppErrorBoundary>
            <Bomb explode={explode} />
          </AppErrorBoundary>
        </>
      );
    }

    const view = await render(<Harness />);
    expect(view.getByText('Something went wrong')).toBeTruthy();

    await act(async () => fireEvent.press(view.getByText('Defuse')));
    await act(async () => fireEvent.press(view.getByLabelText('Try again')));

    expect(view.getByText('Recovered')).toBeTruthy();
  });

  it('offers a restart only after a retry has already been attempted', async () => {
    const view = await render(
      <AppErrorBoundary>
        <Bomb explode />
      </AppErrorBoundary>,
    );
    expect(view.queryByLabelText('Restart the app')).toBeNull();

    // Retrying re-throws, because the child still fails.
    await act(async () => fireEvent.press(view.getByLabelText('Try again')));
    expect(view.getByLabelText('Restart the app')).toBeTruthy();
  });
});
