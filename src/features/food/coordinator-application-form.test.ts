import {
  COORDINATOR_STEPS,
  hasErrors,
  initialCoordinatorApplicationValues,
  isComplete,
  maskAccountNumber,
  toApplicationRequest,
  validateStep,
  type CoordinatorApplicationValues,
} from './coordinator-application-form';

function complete(
  overrides: Partial<CoordinatorApplicationValues> = {},
): CoordinatorApplicationValues {
  return {
    ...initialCoordinatorApplicationValues,
    contactName: 'Ada Okafor',
    contactPhone: '08031234567',
    addressLine: '14 Awolowo Road',
    city: 'Ikeja',
    state: 'Lagos',
    fulfilment: 'PICKUP',
    bankCode: '058',
    accountNumber: '0123456789',
    verificationConsent: true,
    termsAccepted: true,
    ...overrides,
  };
}

describe('maskAccountNumber', () => {
  it('keeps only the last four digits', () => {
    // The reviewer has to recognise the account, not read it back.
    expect(maskAccountNumber('0123456789')).toBe('******6789');
  });

  it('never lengthens a short value into something that looks masked', () => {
    expect(maskAccountNumber('123')).toBe('123');
    expect(maskAccountNumber('')).toBe('');
  });
});

describe('validateStep', () => {
  it('accepts a completed form at every step', () => {
    for (const step of COORDINATOR_STEPS) {
      expect(validateStep(step, complete())).toEqual({});
    }
  });

  it('asks for a contact a member could actually reach', () => {
    expect(validateStep('contact', complete({ contactPhone: '12345' })).contactPhone).toBeTruthy();
    expect(validateStep('contact', complete({ contactName: 'Ad' })).contactName).toBeTruthy();
  });

  it('accepts common ways of writing a Nigerian number', () => {
    for (const phone of ['08031234567', '+2348031234567', '0803 123 4567', '803-123-4567']) {
      expect(validateStep('contact', complete({ contactPhone: phone }))).toEqual({});
    }
  });

  it('lets an individual coordinate without a business', () => {
    // Requiring a registration number would exclude exactly the people this
    // product exists for.
    expect(
      validateStep('business', complete({ businessName: '', businessRegistrationNumber: '' })),
    ).toEqual({});
  });

  it('refuses a registration number with no business behind it', () => {
    const errors = validateStep(
      'business',
      complete({ businessName: '', businessRegistrationNumber: 'RC123456' }),
    );
    expect(errors.businessName).toBeTruthy();
  });

  it('makes a delivery promise say where it applies', () => {
    // Delivery is a promise about someone else's food arriving.
    const errors = validateStep('location', complete({ fulfilment: 'DELIVERY' }));
    expect(errors.fulfilmentNotes).toBeTruthy();

    expect(
      validateStep(
        'location',
        complete({ fulfilment: 'DELIVERY', fulfilmentNotes: 'Ikeja and Yaba' }),
      ),
    ).toEqual({});
  });

  it('does not ask a pickup-only coordinator for delivery areas', () => {
    expect(
      validateStep('location', complete({ fulfilment: 'PICKUP', fulfilmentNotes: '' })),
    ).toEqual({});
  });

  it('requires a ten-digit account number', () => {
    expect(
      validateStep('settlement', complete({ accountNumber: '12345' })).accountNumber,
    ).toBeTruthy();
    expect(
      validateStep('settlement', complete({ accountNumber: '01234567890' })).accountNumber,
    ).toBeTruthy();
  });

  it('will not let someone reach submit without both consents', () => {
    // The backend rejects a submission without them, so a form that allowed it
    // would only produce a 422 after the member had filled in five steps.
    expect(
      validateStep('review', complete({ verificationConsent: false })).verificationConsent,
    ).toBeTruthy();
    expect(validateStep('review', complete({ termsAccepted: false })).termsAccepted).toBeTruthy();
  });
});

describe('toApplicationRequest', () => {
  it('sends the masked account, never the number typed', () => {
    const request = toApplicationRequest(complete());
    expect(request?.settlementAccountMasked).toBe('******6789');
    expect(JSON.stringify(request)).not.toContain('0123456789');
  });

  it('groups the fields the way a reviewer reads them', () => {
    const request = toApplicationRequest(complete());
    expect(request?.personalDetails).toEqual({
      businessContactName: 'Ada Okafor',
      contactPhone: '08031234567',
    });
    expect(request?.operatingLocation).toEqual({
      addressLine: '14 Awolowo Road',
      city: 'Ikeja',
      state: 'Lagos',
    });
    expect(request?.fulfilmentLocations).toEqual({ method: 'PICKUP' });
  });

  it('omits businessDetails entirely for an individual', () => {
    // An absent object says "individual coordinator"; an empty one says "a
    // business whose details we failed to collect".
    const request = toApplicationRequest(complete());
    expect(request).not.toHaveProperty('businessDetails');
  });

  it('includes businessDetails when there is a business', () => {
    const request = toApplicationRequest(
      complete({ businessName: 'Okafor Foods', businessRegistrationNumber: 'RC123456' }),
    );
    expect(request?.businessDetails).toEqual({
      businessName: 'Okafor Foods',
      registrationNumber: 'RC123456',
    });
  });

  it('trims what the member typed', () => {
    const request = toApplicationRequest(complete({ contactName: '  Ada Okafor  ' }));
    expect(request?.personalDetails.businessContactName).toBe('Ada Okafor');
  });

  it('refuses to build a partial application', () => {
    // POST creates the application. A half-filled one would sit in review
    // missing the details a reviewer needs to assess it.
    expect(toApplicationRequest(initialCoordinatorApplicationValues)).toBeNull();
    expect(toApplicationRequest(complete({ termsAccepted: false }))).toBeNull();
    expect(toApplicationRequest(complete({ accountNumber: 'not-a-number' }))).toBeNull();
  });
});

describe('isComplete', () => {
  it('agrees with every step passing', () => {
    expect(isComplete(complete())).toBe(true);
    expect(isComplete(initialCoordinatorApplicationValues)).toBe(false);
  });

  it('is false while any single step still fails', () => {
    for (const field of ['contactName', 'addressLine', 'bankCode'] as const) {
      expect(isComplete(complete({ [field]: '' }))).toBe(false);
    }
  });
});

describe('hasErrors', () => {
  it('reports an empty error set as clean', () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ contactName: 'required' })).toBe(true);
  });
});
