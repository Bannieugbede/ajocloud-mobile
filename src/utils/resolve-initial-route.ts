export type NavigationState = {
  authenticated: boolean;
  onboardingComplete: boolean;
  verified: boolean;
  hasOrganization: boolean;
};

export function resolveInitialRoute(state: NavigationState) {
  if (!state.authenticated) return '/(auth)/welcome' as const;
  if (!state.verified) return '/(auth)/verify' as const;
  if (!state.onboardingComplete) return '/(onboarding)' as const;
  if (!state.hasOrganization) return '/organizations/select' as const;
  return '/(tabs)/home' as const;
}
