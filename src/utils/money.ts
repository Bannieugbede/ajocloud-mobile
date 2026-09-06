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

/**
 * The major-unit string a minor amount came from, for prefilling a field.
 *
 * The inverse of `majorToMinor`, and exact for the same reason: string
 * arithmetic rather than division, which would round. A trailing ".00" is
 * dropped, because "25000" is what someone would have typed and what they
 * expect to see in the field they are about to edit.
 */
export function minorToMajor(amountMinor: string): string {
  const trimmed = amountMinor.trim();
  if (!/^\d+$/.test(trimmed)) return '';
  const padded = trimmed.padStart(3, '0');
  const whole = padded.slice(0, -2).replace(/^0+(?=\d)/, '');
  const fraction = padded.slice(-2);
  return fraction === '00' ? whole : `${whole}.${fraction}`;
}
