/**
 * Domain statuses arrive from the backend as SCREAMING_SNAKE. Screens render
 * them as plain text, so they are title-cased once here rather than in each
 * screen, keeping the same status worded identically everywhere.
 */
export function statusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
