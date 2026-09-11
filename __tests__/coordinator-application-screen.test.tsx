import { act, fireEvent, render } from '@testing-library/react-native';

import { CoordinatorApplicationScreen } from '@/features/food/coordinator-application-screen';

const BANKS = [
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '044', name: 'Access Bank' },
];

function setup(overrides: Partial<React.ComponentProps<typeof CoordinatorApplicationScreen>> = {}) {
  return render(
    <CoordinatorApplicationScreen
      banks={BANKS}
      banksLoading={false}
      submitting={false}
      onSubmit={jest.fn()}
      {...overrides}
    />,
  );
}

const press = async (
  view: ReturnType<typeof setup> extends Promise<infer T> ? T : never,
  name: string,
) => act(async () => fireEvent.press(view.getByRole('button', { name })));

const type = async (
  view: ReturnType<typeof setup> extends Promise<infer T> ? T : never,
  label: string,
  value: string,
) => act(async () => fireEvent.changeText(view.getByLabelText(label), value));

/**
 * Picks an option from an AppSelect.
 *
 * Searches first: the sheet renders its options in a FlatList, so an option far
 * down a long list is not mounted until the list is narrowed — which is also
 * what someone picking "Lagos" out of 37 states would actually do.
 */
const choose = async (
  view: ReturnType<typeof setup> extends Promise<infer T> ? T : never,
  field: string,
  option: string,
) => {
  await act(async () => fireEvent.press(view.getByLabelText(field)));
  await act(async () =>
    fireEvent.changeText(
      view.getByLabelText(`Search ${field.split('.')[0]!.toLowerCase()}`),
      option,
    ),
  );
  await act(async () => fireEvent.press(view.getByText(option)));
};

/** Fills contact and walks past the optional business step. */
async function fillToLocation(view: Awaited<ReturnType<typeof setup>>) {
  await type(view, 'Full name', 'Ada Okafor');
  await type(view, 'Phone number', '08031234567');
  await type(view, 'WhatsApp number', '08031234567');
  await press(view, 'Continue');
  // A business is still optional, but an individual is identified by a NIN,
  // so the step can no longer simply be walked past.
  await type(view, 'NIN', '12345678901');
  await press(view, 'Continue');
}

/** Fills every step and stops on review, which is where most of these start. */
async function fillToReview(view: Awaited<ReturnType<typeof setup>>) {
  await fillToLocation(view);
  await type(view, 'Street address', '14 Awolowo Road');
  await type(view, 'Town or city', 'Ikeja');
  await choose(view, 'State. Choose a state', 'Lagos');
  await press(view, 'Continue');
  await choose(view, 'Bank. Choose your bank', 'Access Bank');
  await type(view, 'Account number', '0123456789');
  await press(view, 'Continue');
}

it('opens on the first step and says how many there are', async () => {
  const view = await setup();
  expect(view.getByText('STEP 1 OF 5: CONTACT')).toBeTruthy();
});

it('will not advance past a step that is not filled in', async () => {
  // Five steps exist so a mistake on one does not discard the others; letting
  // someone walk past an empty one would defeat that.
  const view = await setup();
  await press(view, 'Continue');
  expect(view.getByText('STEP 1 OF 5: CONTACT')).toBeTruthy();
  expect(view.getByText('Enter the name a member would ask for.')).toBeTruthy();
});

it('advances once a step is valid', async () => {
  const view = await setup();
  await type(view, 'Full name', 'Ada Okafor');
  await type(view, 'Phone number', '08031234567');
  await type(view, 'WhatsApp number', '08031234567');
  await press(view, 'Continue');
  expect(view.getByText('STEP 2 OF 5: BUSINESS')).toBeTruthy();
});

it('lets an individual past the business step on a NIN alone', async () => {
  // Requiring a CAC number would exclude exactly the people this product
  // exists for, so an individual gives a NIN instead and moves on.
  const view = await setup();
  await fillToLocation(view);
  expect(view.getByText('STEP 3 OF 5: LOCATION')).toBeTruthy();
});

it('will not pass the business step with neither CAC nor NIN', async () => {
  // Somebody handling other people's food money has to be identifiable.
  const view = await setup();
  await type(view, 'Full name', 'Ada Okafor');
  await type(view, 'Phone number', '08031234567');
  await type(view, 'WhatsApp number', '08031234567');
  await press(view, 'Continue');
  await press(view, 'Continue');
  expect(view.getByText('STEP 2 OF 5: BUSINESS')).toBeTruthy();
});

it('keeps what was typed when stepping back', async () => {
  const view = await setup();
  await type(view, 'Full name', 'Ada Okafor');
  await type(view, 'Phone number', '08031234567');
  await type(view, 'WhatsApp number', '08031234567');
  await press(view, 'Continue');
  await press(view, 'Back');
  expect(view.getByDisplayValue('Ada Okafor')).toBeTruthy();
});

it('offers no way back from the first step', async () => {
  const view = await setup();
  expect(view.queryByRole('button', { name: 'Back' })).toBeNull();
});

it('asks for delivery areas only when delivery is offered', async () => {
  const view = await setup();
  await fillToLocation(view);

  expect(view.queryByLabelText('Areas you deliver to')).toBeNull();
  await act(async () => fireEvent.press(view.getByRole('radio', { name: 'Delivery' })));
  expect(view.getByLabelText('Areas you deliver to')).toBeTruthy();
});

it('tells the applicant what happens to their account number', async () => {
  // Someone typing an account number is entitled to know what is kept.
  const view = await setup();
  await fillToLocation(view);
  await type(view, 'Street address', '14 Awolowo Road');
  await type(view, 'Town or city', 'Ikeja');
  await choose(view, 'State. Choose a state', 'Lagos');
  await press(view, 'Continue');

  expect(view.getByText(/Only the last four digits are stored/)).toBeTruthy();
});

it('shows the masked account on review, never the digits typed', async () => {
  const view = await setup();
  await fillToReview(view);

  expect(view.getByLabelText('Account: ******6789')).toBeTruthy();
  expect(view.queryByText('0123456789')).toBeNull();
  // The bank is named rather than left as a code nobody recognises.
  expect(view.getByLabelText('Bank: Access Bank')).toBeTruthy();
});

it('warns that approval needs full verification before asking to submit', async () => {
  // Stated here rather than discovered at rejection.
  const view = await setup();
  await fillToReview(view);

  expect(view.getByText('Full verification is required')).toBeTruthy();
});

it('refuses to submit without both consents, and submits with them', async () => {
  const onSubmit = jest.fn();
  const view = await setup({ onSubmit });
  await fillToReview(view);

  await press(view, 'Submit application');
  expect(onSubmit).not.toHaveBeenCalled();

  await act(async () =>
    fireEvent.press(view.getByLabelText('I consent to verification of these details')),
  );
  await act(async () => fireEvent.press(view.getByLabelText('I accept the coordinator terms')));
  await press(view, 'Submit application');

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0]).toMatchObject({
    contactName: 'Ada Okafor',
    accountNumber: '0123456789',
    verificationConsent: true,
    termsAccepted: true,
  });
});
