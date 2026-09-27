import type { BillPayment } from '@/api/endpoints/bill-payments';

import {
  supportedCategories,
  categoryIcon,
  categoryTone,
  recentPayments,
  referenceLabel,
  savedBills,
} from './saved-bills';

const payment = (overrides: Partial<BillPayment> = {}): BillPayment => ({
  id: 'p-1',
  internalReference: 'ref-1',
  providerReference: null,
  customerReferenceMasked: '••7841',
  verifiedCustomerName: null,
  amountMinor: '2450000',
  feeMinor: '0',
  totalDebitMinor: '2450000',
  currency: 'NGN',
  status: 'SUCCESSFUL',
  reconciliationState: 'MATCHED',
  failureReason: null,
  createdAt: '2026-07-10T09:00:00.000Z',
  completedAt: '2026-07-10T09:01:00.000Z',
  biller: { id: 'b-dstv', name: 'DSTV', category: { id: 'c-tv', name: 'Cable TV' } },
  ...overrides,
});

describe('the bills someone pays regularly', () => {
  it('keeps one entry per biller and reference, not one per payment', () => {
    // Three months of DSTV is one bill to pay again, not three.
    const bills = savedBills([
      payment({ id: 'p-1', createdAt: '2026-07-10T09:00:00.000Z' }),
      payment({ id: 'p-2', createdAt: '2026-06-10T09:00:00.000Z' }),
      payment({ id: 'p-3', createdAt: '2026-05-10T09:00:00.000Z' }),
    ]);
    expect(bills).toHaveLength(1);
  });

  it('offers the most recent payment of a repeated bill', () => {
    const bills = savedBills([
      payment({ id: 'old', createdAt: '2026-05-10T09:00:00.000Z', amountMinor: '2000000' }),
      payment({ id: 'new', createdAt: '2026-07-10T09:00:00.000Z', amountMinor: '2450000' }),
    ]);
    expect(bills[0]?.paymentId).toBe('new');
    expect(bills[0]?.amountMinor).toBe('2450000');
  });

  it('treats the same biller with a different reference as a separate bill', () => {
    // Two meters in one household are two bills, and paying the wrong one is
    // exactly the mistake the masked reference is shown to prevent.
    const bills = savedBills([
      payment({ id: 'p-1', customerReferenceMasked: '••7841' }),
      payment({ id: 'p-2', customerReferenceMasked: '••2293' }),
    ]);
    expect(bills).toHaveLength(2);
  });

  it('never offers to repeat a payment that failed', () => {
    // Offering it again would suggest the last one worked.
    expect(savedBills([payment({ status: 'FAILED' })])).toEqual([]);
    expect(savedBills([payment({ status: 'PROCESSING' })])).toEqual([]);
  });

  it('skips a payment with no biller, which cannot be repeated', () => {
    expect(savedBills([payment({ biller: undefined })])).toEqual([]);
  });

  it('caps the list so it cannot push the rest of the screen away', () => {
    const many = Array.from({ length: 12 }, (_unused, index) =>
      payment({ id: `p-${String(index)}`, customerReferenceMasked: `••${String(index)}` }),
    );
    expect(savedBills(many)).toHaveLength(5);
  });

  it('has nothing to show for someone who has paid nothing', () => {
    expect(savedBills([])).toEqual([]);
    expect(savedBills()).toEqual([]);
  });
});

describe('recent payments', () => {
  it('shows the newest first, whatever the outcome', () => {
    // Unlike the saved list, a failure belongs here: it is what happened.
    const recent = recentPayments([
      payment({ id: 'old', createdAt: '2026-05-10T09:00:00.000Z' }),
      payment({ id: 'failed', createdAt: '2026-07-11T09:00:00.000Z', status: 'FAILED' }),
    ]);
    expect(recent.map((entry) => entry.id)).toEqual(['failed', 'old']);
  });
});

describe('naming the reference', () => {
  it('uses the words printed on the member’s own bill', () => {
    // "Reference" is correct and useless; someone checking they are paying the
    // right account needs the label their bill uses. One definition, shared
    // with the pay screen, so the same field cannot be named two ways.
    expect(referenceLabel('Electricity')).toBe('Meter number');
    expect(referenceLabel('Cable TV')).toBe('Smartcard number');
    expect(referenceLabel('Airtime')).toBe('Phone number');
    expect(referenceLabel('School Fees')).toBe('Student ID');
  });

  it('falls back to something honest for a category it does not know', () => {
    expect(referenceLabel('Levies')).toBe('Customer reference');
  });
});

describe('supportedCategories', () => {
  const category = (id: string, name: string, providerCode: string) => ({
    id,
    name,
    providerCode,
    expiresAt: '2099-01-01T00:00:00.000Z',
  });

  it('shows only the four offered categories, in order, whatever the server sends', () => {
    const shown = supportedCategories([
      category('w', 'Water', 'WATER'),
      category('c', 'Cable TV', 'CABLE_TV'),
      category('e', 'Electricity', 'ELECTRICITY'),
      category('i', 'Internet', 'INTERNET'),
      category('a', 'Airtime', 'AIRTIME'),
    ]);
    expect(shown.map((entry) => entry.name)).toEqual([
      'Airtime',
      'Internet',
      'Electricity',
      'Cable TV',
    ]);
  });

  it('shows a category listed twice once, keeping the catalogue’s own', () => {
    const shown = supportedCategories([
      category('old', 'Electricity', 'electricity'),
      category('new', 'Electricity', 'ELECTRICITY'),
    ]);
    expect(shown.map((entry) => entry.id)).toEqual(['new']);
  });

  it('shows nothing rather than failing when there is nothing', () => {
    expect(supportedCategories(undefined)).toEqual([]);
  });
});

describe('drawing a category', () => {
  it('gives each of the design’s categories its own colour', () => {
    expect(categoryTone('Electricity')).toBe('electricity');
    expect(categoryTone('Cable TV')).toBe('tv');
    expect(categoryTone('Internet')).toBe('internet');
    expect(categoryTone('Airtime')).toBe('phone');
  });

  it('falls back rather than guessing at an unknown category', () => {
    expect(categoryTone('School Fees')).toBe('other');
  });

  it('gives every category an icon', () => {
    for (const name of [
      'Electricity',
      'Cable TV',
      'Internet',
      'Airtime',
      'Data',
      'School Fees',
      'Insurance',
      'Levies',
    ]) {
      expect(categoryIcon(name)).toBeTruthy();
    }
  });
});
