/**
 * Cache keys shared by more than one screen.
 *
 * Keys were previously written inline wherever a query was declared, which is
 * fine until two screens use the same one for different shapes. The
 * notification feed did exactly that: the inbox moved to `useInfiniteQuery`,
 * which caches `{ pages, pageParams }`, while Home and Settings kept a plain
 * `useQuery` caching `{ items, unreadCount }` under the identical key. Whichever
 * populated the entry first, the other read a shape it did not expect and the
 * app crashed on launch.
 *
 * Naming them here does not make that impossible, but it puts the two spellings
 * next to each other where the difference is visible.
 */
export const queryKeys = {
  notifications: {
    /** The unread count, as Home and the Settings row read it. */
    summary: ['notification-feed'] as const,
    /** The paged inbox. A separate entry, because its cached shape differs. */
    paged: ['notification-feed', 'paged'] as const,
    /** Matches both of the above, for invalidating after a read. */
    all: ['notification-feed'] as const,
  },
} as const;
