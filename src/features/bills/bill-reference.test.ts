import {
  normaliseReference,
  quickAmounts,
  referenceKeyboard,
  referenceProblem,
} from './bill-reference';

describe('bill references', () => {
  it.each([
    ['0803 123 4567', '08031234567'],
    ['+234 803 123 4567', '08031234567'],
    ['2348031234567', '08031234567'],
  ])('sends the phone number %s as %s, the form the backend stores', (raw, expected) => {
    expect(normaliseReference('phone', raw)).toBe(expected);
  });

  it('leaves an unclassified reference as typed, bar surrounding space', () => {
    expect(normaliseReference(null, '  ab 12 ')).toBe('ab 12');
  });

  it.each([
    ['phone', '08031234567', null],
    ['phone', '0803123', 'Enter an 11-digit phone number, for example 08031234567.'],
    ['meter', '45012345678', null],
    ['meter', '4501', 'A meter number is 11 to 13 digits.'],
    ['smartcard', '7020147841', null],
    ['account', 'spn77ab', null],
    [null, 'ab', 'Enter the number shown on your bill.'],
  ] as const)('judges a %s reference %s', (kind, reference, problem) => {
    expect(referenceProblem(kind, reference)).toBe(problem);
  });

  it('opens the keyboard the reference is typed on', () => {
    expect(referenceKeyboard('phone')).toBe('phone-pad');
    expect(referenceKeyboard('meter')).toBe('number-pad');
    expect(referenceKeyboard('account')).toBe('default');
  });

  it('offers quick amounts only where the payer sets the price', () => {
    expect(quickAmounts('phone')).toContain(500);
    expect(quickAmounts('meter')).toContain(5_000);
    expect(quickAmounts('smartcard')).toEqual([]);
  });
});
