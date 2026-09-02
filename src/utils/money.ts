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

/**
 * Converts a naira amount typed by a user into minor units.
 *
 * Returns null for anything unpayable — blank, malformed, more than two decimal
 * places, or zero — so a caller must handle the invalid case rather than
 * silently sending a wrong amount. Done with strings rather than Number, which
 * would round: 0.1 + 0.2 is not 0.3, and money must be exact.
 */
export function majorToMinor(amountMajor: string): string | null {
  const trimmed = amountMajor.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  const minor = `${whole}${fraction.padEnd(2, '0')}`.replace(/^0+(?=\d)/, '');
  return minor === '' || /^0+$/.test(minor) ? null : minor;
}
