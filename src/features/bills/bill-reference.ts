import type { KeyboardTypeOptions } from 'react-native';

import type { BillReferenceKind } from '@/api/endpoints/bill-payments';

/**
 * How a biller's customer reference is typed, tidied and checked.
 *
 * Mirrors `bill-reference.ts` on the backend so a phone number one digit short
 * is explained under the field rather than by a failed request. The backend
 * still enforces it: this is a courtesy, not the boundary.
 */

/**
 * The reference in the form the backend stores it. "0803 123 4567",
 * "+2348031234567" and "2348031234567" are one line, sent as "08031234567".
 */
export function normaliseReference(kind: BillReferenceKind | null, raw: string): string {
  const compact = raw.trim().replace(/[\s-]/g, '');
  if (kind === null) return raw.trim();
  if (kind !== 'phone') return compact.toUpperCase();
  const digits = compact.replace(/^\+/, '');
  if (/^234\d{10}$/.test(digits)) return `0${digits.slice(3)}`;
  return digits;
}

/** Why a reference cannot be right for this kind of biller, or null. */
export function referenceProblem(kind: BillReferenceKind | null, raw: string): string | null {
  const reference = normaliseReference(kind, raw);
  switch (kind) {
    case 'phone':
      return /^0[789][01]\d{8}$/.test(reference)
        ? null
        : 'Enter an 11-digit phone number, for example 08031234567.';
    case 'meter':
      return /^\d{11,13}$/.test(reference) ? null : 'A meter number is 11 to 13 digits.';
    case 'smartcard':
      return /^\d{10,12}$/.test(reference) ? null : 'This number is 10 to 12 digits.';
    case 'account':
      return /^[A-Z0-9]{6,20}$/.test(reference)
        ? null
        : 'An account number is 6 to 20 letters or digits.';
    case null:
      return reference.length >= 3 ? null : 'Enter the number shown on your bill.';
  }
}

export function referenceKeyboard(kind: BillReferenceKind | null): KeyboardTypeOptions {
  switch (kind) {
    case 'phone':
      return 'phone-pad';
    case 'meter':
    case 'smartcard':
      return 'number-pad';
    default:
      return 'default';
  }
}

export function referencePlaceholder(kind: BillReferenceKind | null): string {
  switch (kind) {
    case 'phone':
      return '0803 123 4567';
    case 'meter':
      return '11 to 13 digits';
    case 'smartcard':
      return '10 to 12 digits';
    default:
      return 'Enter number';
  }
}

/**
 * One-tap amounts for billers the payer prices themselves. Airtime is usually
 * a round hundred; electricity a round thousand. Each is in naira.
 */
export function quickAmounts(kind: BillReferenceKind | null): readonly number[] {
  switch (kind) {
    case 'phone':
      return [100, 200, 500, 1_000, 2_000, 5_000];
    case 'meter':
      return [1_000, 2_000, 5_000, 10_000, 20_000, 50_000];
    default:
      return [];
  }
}
