jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Screens that draw their own header read the safe-area insets, which have no
// value outside a provider. This is the library's own mock, so the numbers
// match what a device reports rather than a hand-written guess.
jest.mock('react-native-safe-area-context', () => {
  // The library's mock is a default export, so it is unwrapped here rather
  // than returned whole — otherwise every hook resolves to undefined.
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});
