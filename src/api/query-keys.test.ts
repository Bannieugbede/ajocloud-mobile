import { queryKeys } from './query-keys';

describe('notification feed keys', () => {
  it('keeps the paged inbox on a different entry from the unread count', () => {
    // These cache different shapes — { pages, pageParams } against
    // { items, unreadCount } — so sharing one entry meant whichever read
    // second found a shape it did not expect and crashed the app on launch.
    expect(queryKeys.notifications.paged).not.toEqual(queryKeys.notifications.summary);
  });

  it('gives the paged key the summary key as its prefix', () => {
    // Which is what lets one invalidation refresh both.
    expect(queryKeys.notifications.paged.slice(0, 1)).toEqual([...queryKeys.notifications.summary]);
  });

  it('invalidates both from the shared prefix', () => {
    expect(queryKeys.notifications.all).toEqual(queryKeys.notifications.summary);
  });
});
