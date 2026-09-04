import { act, fireEvent, render } from '@testing-library/react-native';

import { PayContributionScreen } from './pay-contribution-screen';

const baseProps = {
  groupName: 'Lagos Traders',
  sequence: 3,
  amountDueMinor: '500000',
  amountPaidMinor: '0',
  currency: 'NGN',
  submitting: false,
  onSubmit: jest.fn(),
};

const setup = async (overrides = {}) =>
  await render(<PayContributionScreen {...baseProps} onSubmit={jest.fn()} {...overrides} />);

describe('PayContributionScreen', () => {
  it('offers the whole outstanding amount as the primary action', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay ₦5,000.00' }));
    });

    expect(onSubmit).toHaveBeenCalledWith('500000');
  });

  it('offers only the remainder when part has already been paid', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ amountPaidMinor: '200000', onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay ₦3,000.00' }));
    });

    // Re-paying the full amount would be refused by the server, and asking for
    // it would be wrong anyway: only ₦3,000 is still owed.
    expect(onSubmit).toHaveBeenCalledWith('300000');
  });

  it('says how much has already been paid on a part-paid round', async () => {
    const view = await setup({ amountPaidMinor: '200000' });
    expect(view.getByText(/₦2,000\.00 of ₦5,000\.00 already paid/)).toBeTruthy();
  });

  it('says nothing about prior payment when none has been made', async () => {
    const view = await setup();
    expect(view.queryByText(/already paid/)).toBeNull();
  });

  it('converts a part payment from naira into minor units', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay part of it' }));
    });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText(/Amount/), '1500');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay this amount' }));
    });

    expect(onSubmit).toHaveBeenCalledWith('150000');
  });

  it('refuses a part payment larger than what is owed', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay part of it' }));
    });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText(/Amount/), '9000');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay this amount' }));
    });

    // The server refuses overpayment; saying so here costs no round trip.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.getByText(/between zero and what is still owed/)).toBeTruthy();
  });

  it('refuses a part payment that is not a number', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay part of it' }));
    });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText(/Amount/), 'abc');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay this amount' }));
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses zero', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay part of it' }));
    });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText(/Amount/), '0');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay this amount' }));
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts a part payment of exactly what remains', async () => {
    const onSubmit = jest.fn();
    const view = await setup({ onSubmit });

    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay part of it' }));
    });
    await act(async () => {
      fireEvent.changeText(view.getByLabelText(/Amount/), '5000');
    });
    await act(async () => {
      fireEvent.press(view.getByRole('button', { name: 'Pay this amount' }));
    });

    expect(onSubmit).toHaveBeenCalledWith('500000');
  });

  it('shows a server error where a screen reader will announce it', async () => {
    const view = await setup({
      error: { kind: 'validation', message: 'Your wallet does not have enough' },
    });
    expect(view.getByText('Your wallet does not have enough')).toBeTruthy();
  });

  it('says the money stays in the group until everyone has paid', async () => {
    // The solvency rule is the thing most likely to surprise someone, so it is
    // stated before they pay rather than explained afterwards.
    const view = await setup();
    expect(view.getByText(/Nothing leaves the group until every member has paid/)).toBeTruthy();
  });
});
