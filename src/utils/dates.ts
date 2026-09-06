/**
 * Dates as screens read them.
 *
 * All formatting is done in UTC, the frame the backend stores instants in. A
 * deadline is typically the last instant of its day; rendered in local time that
 * instant belongs to the *next* date for anyone east of Greenwich, so a due date
 * of the 13th would show every member in Lagos the 14th — a day of grace nobody
 * agreed to, on the screens that say when money is late.
 */

/** "30 Aug 2026", or a worded absence. Never "Invalid Date". */
export function longDate(value: string | null | undefined, locale?: string): string {
  const date = parse(value);
  return date
    ? date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
        year: 'numeric',
      })
    : 'No date';
}

/**
 * "Aug 30" — for a card or a list, where three facts sit side by side and the
 * year is almost never the one that decides anything.
 */
export function shortDate(value: string | null | undefined, locale?: string): string {
  const date = parse(value);
  return date
    ? date.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
    : 'No date';
}

/** "10 Jul 2026 · 10:34 AM" — when something actually happened. */
export function dateAndTime(value: string | null | undefined, locale?: string): string | null {
  const date = parse(value);
  if (!date) return null;
  const day = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${day} · ${time}`;
}

function parse(value: string | null | undefined): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}
