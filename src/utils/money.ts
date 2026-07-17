export function formatMinorAmount(amountMinor: string, currency = 'NGN'): string {
  const amount = Number(amountMinor) / 100;
  if (!Number.isSafeInteger(Number(amountMinor)) || !Number.isFinite(amount))
    return `${currency} —`;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
}
