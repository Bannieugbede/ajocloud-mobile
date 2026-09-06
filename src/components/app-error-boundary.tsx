import * as Updates from 'expo-updates';
import { Component, type ErrorInfo, type PropsWithChildren } from 'react';

import { crashReference, shouldOfferReload } from '@/features/errors/crash-report';
import { CrashScreen } from '@/features/errors/crash-screen';

type State = {
  failed: boolean;
  /** The quotable code for the crash currently on screen. */
  reference: string;
  /** How many times the member has asked to retry without leaving this state. */
  attempts: number;
};

/**
 * The last line of defence.
 *
 * It wraps everything, above the theme provider and the navigator, so it
 * catches a failure in any of them. The previous version rendered a fixed
 * sentence — "Please close the app and try again" — with no control at all,
 * which meant one bad render bricked the app until the member force-quit it.
 *
 * Retrying remounts the tree, which is enough when the cause was transient. If
 * that fails the screen offers a full bundle reload, because a crash during
 * first render tends to repeat on a plain remount.
 */
export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false, reference: '', attempts: 0 };

  static getDerivedStateFromError(): Partial<State> {
    // The reference is minted here rather than in render, so it stays fixed
    // while the member is reading it instead of changing under them.
    return { failed: true, reference: crashReference() };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // A production reporter belongs here, keyed by this.state.reference so a
    // member quoting it can be matched to their report. Whatever is sent must
    // be redacted first: a stack can hold tokens, PINs and account numbers.
  }

  private retry = () => {
    this.setState((state) => ({
      failed: false,
      reference: state.reference,
      attempts: state.attempts + 1,
    }));
  };

  private reload = () => {
    // Ignores its own failure: if reloading is unavailable the member is left
    // exactly where they were, which is better than a crash inside the crash
    // screen.
    void Updates.reloadAsync().catch(() => undefined);
  };

  render() {
    if (this.state.failed) {
      return (
        <CrashScreen
          reference={this.state.reference}
          onRetry={this.retry}
          onReload={this.reload}
          canReload={shouldOfferReload(this.state.attempts)}
        />
      );
    }
    return this.props.children;
  }
}
