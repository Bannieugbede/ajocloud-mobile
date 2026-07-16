import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';

type State = { failed: boolean };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // A production reporter may be added here, but sensitive data must be redacted.
  }

  render() {
    if (this.state.failed) {
      return (
        <View accessibilityRole="alert" style={styles.container}>
          <AppText weight="semibold">Ajo Cloud could not start.</AppText>
          <AppText>Please close the app and try again.</AppText>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8, justifyContent: 'center', padding: 24 },
});
