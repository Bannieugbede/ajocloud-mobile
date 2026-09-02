import type { AjoSwapRequest } from '@/api/endpoints/ajo-groups';

/**
 * Swaps needing this member's decision, which the screen surfaces first.
 *
 * `awaitingMyDecision` is computed by the server because it depends on who owns
 * the two affected positions; re-deriving it here would risk disagreeing with
 * what the approve route will actually accept.
 */
export function pendingMyDecision(swaps: readonly AjoSwapRequest[]): AjoSwapRequest[] {
  return swaps.filter((swap) => swap.awaitingMyDecision);
}

/** Everything else, so history stays visible below the actionable list. */
export function otherSwaps(swaps: readonly AjoSwapRequest[]): AjoSwapRequest[] {
  return swaps.filter((swap) => !swap.awaitingMyDecision);
}

/** What a swap proposes, in the terms a member thinks in. */
export function swapSummary(swap: AjoSwapRequest): string {
  const from = swap.from.displayName;
  const to = swap.to.displayName;
  const fromPosition = swap.from.position ?? '?';
  const toPosition = swap.to.position ?? '?';
  return `${from} (position ${String(fromPosition)}) and ${to} (position ${String(toPosition)}) would trade places`;
}

/** A settled swap says what happened; a live one says what is needed. */
export function statusLabel(swap: AjoSwapRequest): string {
  switch (swap.status) {
    case 'PENDING':
      return swap.awaitingMyDecision ? 'Waiting for you' : 'Waiting for the other member';
    case 'EXECUTED':
      return 'Done — the rotation was updated';
    case 'REJECTED':
      return 'Declined';
    case 'EXPIRED':
      return 'Expired without a decision';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return swap.status;
  }
}

/**
 * Hours left to decide, or null when the request is settled or has no deadline.
 *
 * Rounded up so a request with forty minutes left reads as "1 hour", never as
 * "0 hours", which would look expired.
 */
export function hoursRemaining(swap: AjoSwapRequest, now: Date): number | null {
  if (swap.status !== 'PENDING' || !swap.expiresAt) return null;
  const remaining = new Date(swap.expiresAt).getTime() - now.getTime();
  if (Number.isNaN(remaining) || remaining <= 0) return null;
  return Math.ceil(remaining / 3_600_000);
}

/** The deadline in words, for the card. */
export function deadlineLabel(swap: AjoSwapRequest, now: Date): string | null {
  const hours = hoursRemaining(swap, now);
  if (hours === null) return null;
  if (hours <= 1) return 'Less than an hour left to decide';
  if (hours < 24) return `${String(hours)} hours left to decide`;
  const days = Math.ceil(hours / 24);
  return `${String(days)} day${days === 1 ? '' : 's'} left to decide`;
}

/**
 * Whether the approve and reject buttons should be offered.
 *
 * Mirrors the server rule rather than merely checking status: a request whose
 * deadline has passed is refused there, so offering the button would produce an
 * error the member could not have predicted.
 */
export function canDecide(swap: AjoSwapRequest, now: Date): boolean {
  if (!swap.awaitingMyDecision || swap.status !== 'PENDING') return false;
  return !swap.expiresAt || new Date(swap.expiresAt).getTime() > now.getTime();
}
