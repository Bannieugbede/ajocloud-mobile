import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AppToastHost, MAX_VISIBLE_TOASTS, currentToasts, toast } from '@/components/ui/app-toast';
import { createQueryCaches } from '@/providers/query-toasts';

describe('the toast store', () => {
  it('shows the newest first', () => {
    toast.success('First');
    toast.error('Second');
    expect(currentToasts().map((entry) => entry.message)).toEqual(['Second', 'First']);
  });

  it('shows the same news once, restarting its timer rather than stacking', () => {
    toast.error('No connection');
    toast.error('No connection');
    expect(currentToasts()).toHaveLength(1);
    expect(currentToasts()[0]?.version).toBe(1);
  });

  it('replaces a toast shown again with the same id', () => {
    toast.warning('You’re offline', { id: 'connectivity', duration: Infinity });
    toast.success('Back online', { id: 'connectivity' });
    expect(currentToasts()).toEqual([
      expect.objectContaining({ id: 'connectivity', tone: 'success', message: 'Back online' }),
    ]);
  });

  it('keeps no more than a few on screen, dropping the oldest', () => {
    for (let index = 0; index < MAX_VISIBLE_TOASTS + 2; index += 1) toast.info(`Note ${index}`);
    expect(currentToasts()).toHaveLength(MAX_VISIBLE_TOASTS);
    expect(currentToasts()[0]?.message).toBe(`Note ${MAX_VISIBLE_TOASTS + 1}`);
  });

  it('gives errors longer than successes, and longer still with an action', () => {
    toast.success('Saved');
    toast.error('Failed');
    toast.error('Retryable', { action: { label: 'Try again', onPress: jest.fn() } });
    const [retryable, failed, saved] = currentToasts();
    expect(failed!.duration).toBeGreaterThan(saved!.duration);
    expect(retryable!.duration).toBeGreaterThan(failed!.duration);
  });
});

describe('the toast host', () => {
  it('draws each toast as an alert, with its title and message', async () => {
    const view = await render(<AppToastHost />);
    await act(async () => {
      toast.error('Check your connection.', { title: 'Couldn’t load' });
    });
    expect(view.getByTestId('toast-error')).toBeTruthy();
    expect(view.getByText('Couldn’t load')).toBeTruthy();
    expect(view.getByText('Check your connection.')).toBeTruthy();
    // The card fades in from transparent, and animations do not run in tests,
    // so it is still at opacity 0 here; the role is what is being checked.
    expect(view.getByRole('alert', { includeHiddenElements: true })).toBeTruthy();
  });

  it('runs the action when it is pressed', async () => {
    const onPress = jest.fn();
    const view = await render(<AppToastHost />);
    await act(async () => {
      toast.error('Could not load', { action: { label: 'Try again', onPress } });
    });
    await act(async () => fireEvent.press(view.getByRole('button', { name: 'Try again' })));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('dismisses itself after its time is up', async () => {
    jest.useFakeTimers();
    try {
      await render(<AppToastHost />);
      await act(async () => {
        toast.success('Saved', { duration: 1_000 });
      });
      await act(async () => {
        jest.advanceTimersByTime(2_000);
      });
      expect(currentToasts()).toHaveLength(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('draws nothing when there is nothing to say', async () => {
    const view = await render(<AppToastHost />);
    expect(view.queryByTestId('toast-host')).toBeNull();
  });
});

describe('failures and successes from React Query', () => {
  const clientWithToasts = () => {
    const client: QueryClient = new QueryClient({
      ...createQueryCaches(() => client),
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
        mutations: { gcTime: Infinity },
      },
    });
    return client;
  };

  it('toasts a failed load, and offers to try it again', async () => {
    const client = clientWithToasts();
    const load = jest.fn().mockRejectedValue({ kind: 'network', message: 'No connection' });
    await client.fetchQuery({ queryKey: ['groups'], queryFn: load }).catch(() => undefined);

    const [shown] = currentToasts();
    expect(shown).toMatchObject({
      tone: 'error',
      title: 'Couldn’t load',
      message: 'No connection',
    });
    load.mockResolvedValue([]);
    await act(async () => shown!.action!.onPress());
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('stays quiet for a load whose screen explains the failure itself', async () => {
    const client = clientWithToasts();
    await client
      .fetchQuery({
        queryKey: ['invitation'],
        queryFn: () => Promise.reject({ message: 'Gone' }),
        meta: { toast: false },
      })
      .catch(() => undefined);
    expect(currentToasts()).toHaveLength(0);
  });

  it('toasts a failed action with its own heading', async () => {
    const client = clientWithToasts();
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.reject({ message: 'Declined by your bank' }),
        meta: { errorTitle: 'Nothing has been charged' },
      })
      .execute(undefined)
      .catch(() => undefined);
    expect(currentToasts()[0]).toMatchObject({
      tone: 'error',
      title: 'Nothing has been charged',
      message: 'Declined by your bank',
    });
  });

  it('announces a success the action declares', async () => {
    const client = clientWithToasts();
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.resolve('ok'),
        meta: { successMessage: 'You’ve joined the group.' },
      })
      .execute(undefined);
    expect(currentToasts()[0]).toMatchObject({
      tone: 'success',
      message: 'You’ve joined the group.',
    });
  });

  it('falls back to a plain message when an error has none', async () => {
    const client = clientWithToasts();
    await client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(new Error('')) })
      .execute(undefined)
      .catch(() => undefined);
    expect(currentToasts()[0]?.message).toBe('Something went wrong. Please try again.');
  });
});
