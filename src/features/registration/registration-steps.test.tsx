import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { setTransactionPin } from '@/api/endpoints/auth';
import { ConfirmPinStep, CreatePinStep } from './pin-steps';
import { IntentStep } from './intent-step';

jest.mock('@/api/endpoints/auth', () => ({ setTransactionPin: jest.fn() }));

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      queries: { gcTime: Number.POSITIVE_INFINITY },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => jest.clearAllMocks());

describe('CreatePinStep', () => {
  it('refuses a repeated-digit PIN without leaving the step', async () => {
    const onChosen = jest.fn();
    const view = await render(<CreatePinStep onChosen={onChosen} />, { wrapper: Wrapper });
    await fireEvent.changeText(view.getByLabelText('New PIN'), '0000');
    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(await view.findByText('Avoid a PIN that repeats one digit')).toBeTruthy();
    expect(onChosen).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('refuses a sequential PIN', async () => {
    const onChosen = jest.fn();
    const view = await render(<CreatePinStep onChosen={onChosen} />, { wrapper: Wrapper });
    await fireEvent.changeText(view.getByLabelText('New PIN'), '1234');
    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(await view.findByText('Avoid a PIN that runs in sequence')).toBeTruthy();
    expect(onChosen).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('accepts an unpredictable PIN', async () => {
    const onChosen = jest.fn();
    const view = await render(<CreatePinStep onChosen={onChosen} />, { wrapper: Wrapper });
    await fireEvent.changeText(view.getByLabelText('New PIN'), '1357');
    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(onChosen).toHaveBeenCalledWith('1357'));
    await view.unmount();
  });

  it('ignores non-digits so the PIN is always numeric', async () => {
    const onChosen = jest.fn();
    const view = await render(<CreatePinStep onChosen={onChosen} />, { wrapper: Wrapper });
    await fireEvent.changeText(view.getByLabelText('New PIN'), '1a3b5c7');
    await fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(onChosen).toHaveBeenCalledWith('1357'));
    await view.unmount();
  });
});

describe('ConfirmPinStep', () => {
  it('reports a mismatch without calling the backend', async () => {
    const view = await render(
      <ConfirmPinStep chosenPin="1357" onConfirmed={jest.fn()} onRestart={jest.fn()} />,
      { wrapper: Wrapper },
    );
    await fireEvent.changeText(view.getByLabelText('Confirm PIN'), '2468');
    await fireEvent.press(view.getByRole('button', { name: 'Save PIN' }));
    expect(await view.findByText('Those PINs do not match')).toBeTruthy();
    expect(setTransactionPin).not.toHaveBeenCalled();
    await view.unmount();
  });

  it('saves a matching PIN and advances', async () => {
    jest.mocked(setTransactionPin).mockResolvedValue({ isSet: true, lockedUntil: null });
    const onConfirmed = jest.fn();
    const view = await render(
      <ConfirmPinStep chosenPin="1357" onConfirmed={onConfirmed} onRestart={jest.fn()} />,
      { wrapper: Wrapper },
    );
    await fireEvent.changeText(view.getByLabelText('Confirm PIN'), '1357');
    await fireEvent.press(view.getByRole('button', { name: 'Save PIN' }));
    await waitFor(() => expect(setTransactionPin).toHaveBeenCalledTimes(1));
    expect(jest.mocked(setTransactionPin).mock.calls[0]?.[0]).toEqual({ pin: '1357' });
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledTimes(1));
    await view.unmount();
  });
});

describe('IntentStep', () => {
  it('continues even when nothing is chosen, since the step is optional', async () => {
    const onContinue = jest.fn();
    const view = await render(<IntentStep onContinue={onContinue} />, { wrapper: Wrapper });
    await fireEvent.press(view.getByTestId('intent-continue'));
    await waitFor(() => expect(onContinue).toHaveBeenCalledWith([]));
    await view.unmount();
  });

  it('exposes each card as a checkbox so its state is announced', async () => {
    const view = await render(<IntentStep onContinue={jest.fn()} />, { wrapper: Wrapper });
    const cards = view.getAllByRole('checkbox');
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card.props.accessibilityState.checked).toBe(false);
    }
    await view.unmount();
  });
});
