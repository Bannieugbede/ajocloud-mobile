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
};

export type BillBiller = {
  id: string;
  providerCode: string;
  name: string;
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

/**
 * Pays a validated bill from a wallet.
 *
 * Requires `Idempotency-Key`; replaying a key returns the original payment
 * rather than charging again.
 */
export function createBillPayment(
  input: {
    walletId: string;
    validationId: string;
    customerReference: string;
    amountMinor: string;
  },
  idempotencyKey: string,
): Promise<BillPayment> {
  return client().request('/api/v1/bill-payments', {
    method: 'POST',
    body: input,
    idempotencyKey,
  });
}

export function listBillPayments(): Promise<BillPayment[]> {
  return client().request('/api/v1/bill-payments');
}

export function getBillPayment(paymentId: string): Promise<BillPayment> {
  return client().request(`/api/v1/bill-payments/${encodeURIComponent(paymentId)}`);
}
