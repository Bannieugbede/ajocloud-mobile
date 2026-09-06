import { act, fireEvent, render } from '@testing-library/react-native';

import { SupportScreen } from '@/features/profile/support-screen';
import { FAQS } from '@/features/profile/support-faqs';

function setup(overrides = {}) {
  return render(
    <SupportScreen
      submitting={false}
      sent={false}
      supportAddress="support@ajocloud.test"
      onSubmit={jest.fn()}
      onStartAnother={jest.fn()}
      onEmailSupport={jest.fn()}
      {...overrides}
    />,
  );
}

it('lists every question with its answer hidden until asked for', async () => {
  const view = await setup();
  expect(view.getByText('How do I join an Ajo group?')).toBeTruthy();
  expect(view.getByText('What is Akawo?')).toBeTruthy();
  expect(view.queryByText(FAQS[0]!.answer)).toBeNull();
});

it('expands one answer and collapses it again', async () => {
  const view = await setup();
  const question = view.getByRole('button', { name: 'How do I join an Ajo group?' });

  await act(async () => fireEvent.press(question));
  expect(view.getByText(FAQS[0]!.answer)).toBeTruthy();

  await act(async () => fireEvent.press(question));
  expect(view.queryByText(FAQS[0]!.answer)).toBeNull();
});

it('keeps only one answer open, so the list stays scannable', async () => {
  const view = await setup();
  await act(async () =>
    fireEvent.press(view.getByRole('button', { name: 'How do I join an Ajo group?' })),
  );
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'What is Akawo?' })));
  expect(view.queryByText(FAQS[0]!.answer)).toBeNull();
  expect(view.getByText(FAQS.find((f) => f.id === 'akawo')!.answer)).toBeTruthy();
});

it('opens the mail app from the email tile', async () => {
  const onEmailSupport = jest.fn();
  const view = await setup({ onEmailSupport });
  await act(async () =>
    fireEvent.press(view.getByLabelText('Email support. support@ajocloud.test')),
  );
  expect(onEmailSupport).toHaveBeenCalledTimes(1);
});

it('does not offer an email tile that goes nowhere', async () => {
  // With no address configured the tile must not look tappable, or it promises
  // a channel that cannot open.
  const view = await setup({ supportAddress: null });
  expect(view.queryByRole('button', { name: /Email support/ })).toBeNull();
  expect(view.getByLabelText('Email support. Not configured')).toBeTruthy();
});

it('refuses a message too short to act on', async () => {
  const onSubmit = jest.fn();
  const view = await setup({ onSubmit });
  await act(async () => {
    fireEvent.changeText(view.getByLabelText('Subject'), 'Help');
    fireEvent.changeText(view.getByLabelText('Message'), 'short');
  });
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Send Message' })));
  expect(onSubmit).not.toHaveBeenCalled();
});

it('sends a complete message', async () => {
  const onSubmit = jest.fn();
  const view = await setup({ onSubmit });
  await act(async () => {
    fireEvent.changeText(view.getByLabelText('Subject'), 'A payment did not arrive');
    fireEvent.changeText(view.getByLabelText('Message'), 'I funded my wallet and nothing showed.');
  });
  await act(async () => fireEvent.press(view.getByRole('button', { name: 'Send Message' })));
  expect(onSubmit).toHaveBeenCalledWith({
    subject: 'A payment did not arrive',
    message: 'I funded my wallet and nothing showed.',
  });
});

it('keeps the FAQs readable after a message is sent', async () => {
  // The confirmation replaces the form, not the whole screen: someone who has
  // just written in is exactly who might read an answer while they wait.
  const view = await setup({ sent: true });
  expect(view.getByText(/we have your message/i)).toBeTruthy();
  expect(view.getByText('How do I join an Ajo group?')).toBeTruthy();
});

it('promises no reply time the product does not measure', async () => {
  // The mockup's "Live Chat · Avg. reply: 2 min" describes a channel that does
  // not exist: messages are answered by email.
  const view = await setup();
  expect(view.queryByText(/Live Chat/i)).toBeNull();
  expect(view.queryByText(/2 min/i)).toBeNull();
});
