import { apiClient } from '@/api/client/api-client';

export type BillCategory = {
  id: string;
  providerCode: string;
  name: string;
  expiresAt: string;
};

export type BillProduct = {
  id: string;
  providerCode: string;
  name: string;
  /** Null means no lower bound. Minor units as strings. */
  minimumMinor: string | null;
  maximumMinor: string | null;
  /** When set, the amount must equal this exactly — it is not a default. */
  fixedAmountMinor: string | null;
  currency: string;
  /** How long a package lasts, e.g. "30 days". Null for top-ups and meters. */
  validity: string | null;
};

/**
 * What a biller knows its customer by. Decides the keyboard, the placeholder,
 * and how the number is tidied before it is sent. Null on billers the backend
 * has not classified, which are treated as a free-form reference.
 */
export type BillReferenceKind = 'phone' | 'meter' | 'smartcard' | 'account';

export type BillBiller = {
  id: string;
  providerCode: string;
  name: string;
  referenceKind: BillReferenceKind | null;
  /** The field's label, e.g. "Meter number" or "IUC number". */
  referenceLabel: string;
  /** Cheapest first. */
  products: BillProduct[];
};

/**
 * A validated customer reference.
 *
 * Short-lived and bound to the exact reference that produced it: paying quotes
 * both the validation id and the reference, and the backend refuses the pair if
 * they disagree or the validation has expired.
 */
export type BillCustomerValidation = {
  id: string;
  valid: boolean;
  customerReferenceMasked: string;
  verifiedCustomerName: string | null;
  expiresAt: string;
};

export type BillPaymentReceipt = {
  receiptNumber: string;
  issuedAt: string;
} | null;

export type BillPayment = {
  id: string;
  internalReference: string;
  providerReference: string | null;
  customerReferenceMasked: string;
  verifiedCustomerName: string | null;
  amountMinor: string;
  feeMinor: string;
  totalDebitMinor: string;
  currency: string;
  status: string;
  reconciliationState: string;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
  /** Who was paid. Present so a past payment can be offered again by name. */
  biller?: { id: string; name: string; category: { id: string; name: string } };
  /** The package paid for, when the biller has more than one. */
  product?: { id: string; name: string } | null;
  receipt?: BillPaymentReceipt;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function listBillCategories(): Promise<BillCategory[]> {
  return client().request('/api/v1/bill-payments/categories');
}

export function listBillers(categoryId: string): Promise<BillBiller[]> {
  return client().request(
    `/api/v1/bill-payments/billers?categoryId=${encodeURIComponent(categoryId)}`,
  );
}

/**
 * Checks a customer reference with the provider before any money moves.
 *
 * Fails with 422 when the provider rejects the reference, which is the normal
 * way a mistyped meter or phone number is caught.
 */
export function validateBillCustomer(input: {
  billerId: string;
  productId?: string;
  customerReference: string;
}): Promise<BillCustomerValidation> {
  return client().request('/api/v1/bill-payments/validate-customer', {
    method: 'POST',
    body: input,
  });
}

// Paying goes through the shared payment flow (`BILL_PAYMENT` in
// `endpoints/payments.ts`), which asks for the transaction PIN; the direct
// route is gone (backend ADR-014).

export function listBillPayments(): Promise<BillPayment[]> {
  return client().request('/api/v1/bill-payments');
}

export function getBillPayment(paymentId: string): Promise<BillPayment> {
  return client().request(`/api/v1/bill-payments/${encodeURIComponent(paymentId)}`);
}
