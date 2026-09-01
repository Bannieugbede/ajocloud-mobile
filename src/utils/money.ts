/**
 * Minor units arrive from the backend as decimal strings because a ledger balance
 * can exceed `Number.MAX_SAFE_INTEGER`. Everything here stays in `BigInt` and
 * string space so a large group pool is never silently rounded on its way to the
 * screen — a rounded balance in a fintech is a wrong balance.
 */
function parseMinor(amountMinor: string): bigint | null {
  const trimmed = amountMinor.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return BigInt(trimmed);
}

const currencySymbols: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatMinorAmount(amountMinor: string, currency = 'NGN'): string {
  const minor = parseMinor(amountMinor);
  if (minor === null) return `${currency} —`;

  const negative = minor < 0n;
  const absolute = negative ? -minor : minor;
  const major = groupThousands((absolute / 100n).toString());
  const fraction = (absolute % 100n).toString().padStart(2, '0');
  const symbol = currencySymbols[currency] ?? `${currency} `;

  return `${negative ? '-' : ''}${symbol}${major}.${fraction}`;
}

/** Sums minor-unit strings exactly, for wallet and list totals. */
export function sumMinorAmounts(amounts: readonly string[]): string {
  return amounts.reduce((total, amount) => total + (parseMinor(amount) ?? 0n), 0n).toString();
}
