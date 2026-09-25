import {
  MutationCache,
  QueryCache,
  type Mutation,
  type Query,
  type QueryClient,
} from '@tanstack/react-query';

import { toast } from '@/components/ui/app-toast';
import type { AppError } from '@/types/errors';

/**
 * What a query or mutation says about its own toasts, declared where it is
 * used: `useMutation({ ..., meta: { successMessage: 'Saved' } })`.
 */
export type QueryToastMeta = {
  /** False when the screen presents this failure itself, as part of its content. */
  toast?: false;
  /** A heading for the error toast, when "Couldn't load" or none would mislead. */
  errorTitle?: string;
};

export type MutationToastMeta = QueryToastMeta & {
  /** Shown as a success toast when the mutation succeeds. */
  successMessage?: string;
};

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryToastMeta;
    mutationMeta: MutationToastMeta;
  }
}

const FALLBACK = 'Something went wrong. Please try again.';

function messageOf(error: unknown): string {
  const message = (error as Partial<AppError> | null)?.message;
  return typeof message === 'string' && message.trim() !== '' ? message : FALLBACK;
}

/**
 * Every failed load and every failed action becomes a toast, from one place,
 * so no screen has to draw its own error card or red text. A load failure
 * offers to try again. The same message from several screens at once, as
 * when the connection drops, is shown once (see `toast.show`).
 */
export function createQueryCaches(getClient: () => QueryClient) {
  const queryCache = new QueryCache({
    onError: (error: unknown, query: Query<unknown, unknown, unknown, readonly unknown[]>) => {
      if (query.meta?.toast === false) return;
      toast.error(messageOf(error), {
        title: query.meta?.errorTitle ?? 'Couldn’t load',
        action: {
          label: 'Try again',
          onPress: () => void getClient().refetchQueries({ queryKey: query.queryKey, exact: true }),
        },
      });
    },
  });

  const mutationCache = new MutationCache({
    onError: (
      error: unknown,
      _variables: unknown,
      _context: unknown,
      mutation: Mutation<unknown, unknown, unknown, unknown>,
    ) => {
      if (mutation.meta?.toast === false) return;
      toast.error(
        messageOf(error),
        mutation.meta?.errorTitle ? { title: mutation.meta.errorTitle } : {},
      );
    },
    onSuccess: (
      _data: unknown,
      _variables: unknown,
      _context: unknown,
      mutation: Mutation<unknown, unknown, unknown, unknown>,
    ) => {
      if (mutation.meta?.successMessage) toast.success(mutation.meta.successMessage);
    },
  });

  return { queryCache, mutationCache };
}
