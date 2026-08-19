/**
 * Holds the PIN chosen on the create step until it is confirmed on the next.
 *
 * Deliberately in memory only, and never a route parameter: navigation params
 * are observable in dev tooling and can be restored from disk, so the PIN is
 * kept out of them entirely. It is cleared as soon as it is confirmed or the
 * flow is abandoned.
 */
let pendingPin: string | null = null;

export function setPendingPin(pin: string): void {
  pendingPin = pin;
}

export function takePendingPin(): string | null {
  return pendingPin;
}

export function clearPendingPin(): void {
  pendingPin = null;
}
