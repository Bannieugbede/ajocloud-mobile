/**
 * The coordinator application, as a form.
 *
 * The backend takes four free-form JSON objects — `personalDetails`,
 * `businessDetails`, `operatingLocation`, `fulfilmentLocations` — plus masked
 * settlement details and two consents. Nothing constrains their shape server
 * side, so the shape is defined here and documented in
 * `docs/BACKEND_REQUIREMENTS.md`: a reviewer reads these fields by name, and a
 * client that invents its own keys produces applications nobody can assess.
 *
 * Five steps rather than one long form. Someone applying to handle other
 * people's food money is being asked for contact details, a trading address,
 * how they will hand food over, and a settlement account — that is a lot to
 * face at once, and a step that fails validation should not discard the four
 * before it.
 */

export type FulfilmentChoice = 'PICKUP' | 'DELIVERY' | 'DELIVERY_OR_PICKUP';

export type CoordinatorApplicationValues = {
  /** personalDetails */
  contactName: string;
  contactPhone: string;
  /** businessDetails — optional throughout: an individual may coordinate. */
  businessName: string;
  businessRegistrationNumber: string;
  /** operatingLocation */
  addressLine: string;
  city: string;
  state: string;
  /** fulfilmentLocations */
  fulfilment: FulfilmentChoice;
  fulfilmentNotes: string;
  /** Settlement. Only the masked value is ever held; see maskAccountNumber. */
  bankCode: string;
  accountNumber: string;
  /** Consents, both required before the backend will accept a submission. */
  verificationConsent: boolean;
  termsAccepted: boolean;
};

export const initialCoordinatorApplicationValues: CoordinatorApplicationValues = {
  contactName: '',
  contactPhone: '',
  businessName: '',
  businessRegistrationNumber: '',
  addressLine: '',
  city: '',
  state: '',
  fulfilment: 'PICKUP',
  fulfilmentNotes: '',
  bankCode: '',
  accountNumber: '',
  verificationConsent: false,
  termsAccepted: false,
};

export const COORDINATOR_STEPS = [
  'contact',
  'business',
  'location',
  'settlement',
  'review',
] as const;
export type CoordinatorStep = (typeof COORDINATOR_STEPS)[number];

export const STEP_LABELS: Record<CoordinatorStep, string> = {
  contact: 'CONTACT',
  business: 'BUSINESS',
  location: 'LOCATION',
  settlement: 'SETTLEMENT',
  review: 'REVIEW',
};

export const FULFILMENT_OPTIONS: readonly { value: FulfilmentChoice; label: string }[] = [
  { value: 'PICKUP', label: 'Pickup' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'DELIVERY_OR_PICKUP', label: 'Both' },
];

export type FieldErrors = Partial<Record<keyof CoordinatorApplicationValues, string>>;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Nigerian numbers are ten digits after the leading zero, or eleven with it. */
function phoneLooksReal(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, '');
  return /^(\+?234|0)?\d{10}$/.test(digits);
}

/** NUBAN account numbers are ten digits. */
export function accountNumberLooksReal(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

/**
 * The last four digits, the rest masked.
 *
 * The raw account number never leaves this screen: the field the backend stores
 * is `settlementAccountMasked`, and a reviewer confirming settlement details
 * needs to recognise the account, not to read it back. This mirrors how identity
 * numbers are handled elsewhere in the app.
 */
export function maskAccountNumber(value: string): string {
  const digits = value.trim();
  if (digits.length <= 4) return digits;
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function validateStep(
  step: CoordinatorStep,
  values: CoordinatorApplicationValues,
): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 'contact') {
    if (values.contactName.trim().length < 3) {
      errors.contactName = 'Enter the name a member would ask for.';
    }
    if (!phoneLooksReal(values.contactPhone)) {
      errors.contactPhone = 'Enter a phone number members can reach you on.';
    }
  }

  if (step === 'business') {
    // Deliberately no required field: an individual can coordinate, and demanding
    // a registration number would exclude exactly the people this product is for.
    // A registration number without a name is the one incoherent combination.
    if (values.businessRegistrationNumber.trim() && !values.businessName.trim()) {
      errors.businessName = 'Add the business name this number belongs to.';
    }
  }

  if (step === 'location') {
    if (values.addressLine.trim().length < 5) {
      errors.addressLine = 'Enter the street address you trade from.';
    }
    if (values.city.trim().length < 2) errors.city = 'Enter the town or city.';
    if (values.state.trim().length < 2) errors.state = 'Enter the state.';
    if (values.fulfilment !== 'PICKUP' && values.fulfilmentNotes.trim().length < 5) {
      // Delivery is a promise about someone else's food arriving, so the areas
      // covered have to be stated rather than assumed.
      errors.fulfilmentNotes = 'Say which areas you deliver to.';
    }
  }

  if (step === 'settlement') {
    if (values.bankCode.trim().length < 3) errors.bankCode = 'Choose your bank.';
    if (!accountNumberLooksReal(values.accountNumber)) {
      errors.accountNumber = 'Enter your 10-digit account number.';
    }
  }

  if (step === 'review') {
    // Both are checked by the backend on submit, so a form that let someone
    // reach the button without them would only produce a 422.
    if (!values.verificationConsent) {
      errors.verificationConsent = 'We need your consent to verify these details.';
    }
    if (!values.termsAccepted) {
      errors.termsAccepted = 'Accept the coordinator terms to apply.';
    }
  }

  return errors;
}

/** Whether every step passes, used to enable the final submit. */
export function isComplete(values: CoordinatorApplicationValues): boolean {
  return COORDINATOR_STEPS.every((step) => !hasErrors(validateStep(step, values)));
}

export type CoordinatorApplicationRequest = {
  personalDetails: Record<string, unknown>;
  businessDetails?: Record<string, unknown>;
  operatingLocation: Record<string, unknown>;
  fulfilmentLocations: Record<string, unknown>;
  settlementBankCode: string;
  settlementAccountMasked: string;
  verificationConsent: boolean;
  termsAccepted: boolean;
};

/**
 * The request body, or null when anything is still invalid.
 *
 * Returning null rather than a partial body matters: `POST` creates the
 * application, and a half-filled one would sit in review missing the details a
 * reviewer needs.
 */
export function toApplicationRequest(
  values: CoordinatorApplicationValues,
): CoordinatorApplicationRequest | null {
  if (!isComplete(values)) return null;

  const business = values.businessName.trim();
  const registration = values.businessRegistrationNumber.trim();

  return {
    personalDetails: {
      businessContactName: values.contactName.trim(),
      contactPhone: values.contactPhone.trim(),
    },
    // Omitted entirely rather than sent empty: an absent object says "individual
    // coordinator", where {} says "a business whose details we failed to collect".
    ...(business || registration
      ? {
          businessDetails: {
            ...(business ? { businessName: business } : {}),
            ...(registration ? { registrationNumber: registration } : {}),
          },
        }
      : {}),
    operatingLocation: {
      addressLine: values.addressLine.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
    },
    fulfilmentLocations: {
      method: values.fulfilment,
      ...(values.fulfilmentNotes.trim() ? { areas: values.fulfilmentNotes.trim() } : {}),
    },
    settlementBankCode: values.bankCode.trim(),
    // Masked here, so the raw number is never in a request body, a log, or a
    // retry stored by the client.
    settlementAccountMasked: maskAccountNumber(values.accountNumber),
    verificationConsent: values.verificationConsent,
    termsAccepted: values.termsAccepted,
  };
}

/**
 * The application a fresh submission should rewrite rather than duplicate.
 *
 * Applying is two calls — create, then submit — so a submit that fails leaves
 * a DRAFT behind. The backend then refuses to create another ("an active
 * coordinator application already exists"), which would strand the applicant
 * on an error no amount of retrying clears. Reusing that draft turns the retry
 * into the thing they meant.
 *
 * Only genuinely editable statuses qualify: the backend accepts a PATCH for
 * DRAFT and MORE_INFORMATION_REQUIRED alone, and rewriting one already in
 * review would be an attempt to change an application under a reviewer's eyes.
 */
export function resumableApplicationId(
  applications: readonly { id: string; status: string }[] | undefined,
): string | null {
  const editable = (applications ?? []).find(
    (application) =>
      application.status === 'DRAFT' || application.status === 'MORE_INFORMATION_REQUIRED',
  );
  return editable ? editable.id : null;
}
