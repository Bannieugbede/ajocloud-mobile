# Ajo Cloud Mobile

Ajo Cloud Mobile is the native Expo client for community Ajo groups, food savings packages,
personal Akawo goals, wallets, payments, and account management. This repository currently
contains the validated application foundation and the implementation roadmap. Native Welcome and
Introduction, Registration, Phone verification, Email verification, and Sign-in screens are
implemented with real backend contracts. The native tab shell currently exposes an authenticated
account landing route; product tabs continue incrementally from the documented delivery contracts.

## Requirements and installation

- Node.js 22.13 or newer (Expo SDK 57 requirement)
- Bun 1.3 or newer (the committed lockfile is `bun.lock`)
- Xcode 26.4+ for local iOS builds; Android SDK 36 for local Android builds
- Expo Go for supported JavaScript-only work, or a development build for native configuration

```sh
bun install
cp .env.example .env.local
bun start
```

Press `a`, `i`, or `w` in Expo CLI, or use `bun android`, `bun ios`, or `bun web`. Expo Go can run
the foundation and most included Expo modules. Use a development build when testing native config
plugins, notification credentials, biometric behavior, permission text, app links, or production
splash behavior. Test release splash screens in a release build.

## Environment

Set only non-secret compiled values in `.env.local`:

- `EXPO_PUBLIC_APP_ENV`: `development`, `preview`, or `production`
- `EXPO_PUBLIC_API_BASE_URL`: absolute API URL when a contract is available
- `EXPO_PUBLIC_WEB_URL`, support email, privacy URL, and terms URL

Every `EXPO_PUBLIC_` value is readable from the compiled application. Tokens and credentials belong
in SecureStore or backend infrastructure, never environment variables committed to this repository.

## Commands

| Command                                   | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `bun start`                               | Start Expo CLI                                        |
| `bun android` / `bun ios` / `bun web`     | Start a platform target                               |
| `bun run lint` / `bun run lint:fix`       | Check or fix ESLint issues                            |
| `bun run typecheck`                       | Run strict TypeScript checking                        |
| `bun run test` / `bun run test:watch`     | Run Jest tests once or in watch mode                  |
| `bun run format` / `bun run format:check` | Write or verify Prettier formatting                   |
| `bun run validate:terminology`            | Reject prohibited terminology in implementation files |
| `bun run validate`                        | Run the complete quality gate                         |

## Architecture and dependencies

Routes live in `src/app`, implementation code in feature-oriented `src` modules, documentation in
`docs`, and reference-only browser code in ignored `/web-design`. The initial native Stack header,
provider composition, persisted theme preference, Poppins loading, and setup proof are runnable.

Major dependencies have narrow responsibilities: Expo Router/navigation; TanStack Query for server
state; Zustand for small global client preferences; React Hook Form and Zod for validated forms;
SecureStore for sensitive session material; AsyncStorage for non-sensitive theme preference; Expo
Network for connectivity; Expo Image and FlashList for future performance-sensitive media/lists;
React Native Reanimated/Gesture Handler/Screens/SVG for native interaction primitives; and
`date-fns` for date calculations. Device capability packages (camera, pickers, sharing, biometrics,
notifications, updates, clipboard, crypto, and haptics) are installed for mapped flows but must only
be invoked behind a concrete requirement and permission explanation.

The theme is centralized in `src/theme`: brand blue `#0D47A1`, teal `#15B0B8`, semantic light/dark
tokens, Poppins typography, spacing, radius, and touch sizes. Screens must not use the reference
design's colors or browser styling.

## Contribution workflow

Read `AGENTS.md` and the roadmap, select one `READY` item, confirm backend/design dependencies,
implement it with native headers and universal components, add meaningful tests, run validation,
then update documentation and the decision log. Do not commit real secrets or backend inventions.

## Documentation

- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design reference](docs/DESIGN_REFERENCE.md)
- [Screen inventory](docs/SCREEN_INVENTORY.md)
- [Theme](docs/THEME.md)
- [API integration](docs/API_INTEGRATION.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Backend requirements](docs/BACKEND_REQUIREMENTS.md)
- [Seed requirements](docs/SEED_DATA_REQUIREMENTS.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Decision log](docs/DECISIONS.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Troubleshooting and definition of done

If Metro is stale, run `bun start --clear`. If dependency validation fails, run
`npx expo install --check` and resolve versions with `npx expo install`; do not force mismatched
React Native packages. If a native plugin changed, rebuild the development client.

A change is done only when its real states and permissions work, theme and accessibility are
covered, tests and `bun run validate` pass, API/backend implications are recorded, and the roadmap
and related documentation are updated.
