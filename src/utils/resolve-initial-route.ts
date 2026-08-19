export type NavigationState = {
  authenticated: boolean;
  /** False until the first-run introduction is completed or skipped. */
  onboarded: boolean;
  verified: boolean;
  hasOrganization: boolean;
};

export function resolveInitialRoute(state: NavigationState) {
  if (!state.authenticated) {
    return state.onboarded ? ('/(auth)/sign-in' as const) : ('/(auth)/onboarding' as const);
  }
  if (!state.verified) return '/(auth)/verify' as const;
  if (!state.hasOrganization) return '/organizations/select' as const;
  return '/(tabs)/home' as const;
}
