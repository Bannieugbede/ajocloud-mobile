/**
 * Guards the app's entry point against import cycles.
 *
 * A refresh-token fix once shipped with `api-client` importing `session-manager`
 * while `session-manager` reached `api-client` through an endpoint. Every unit
 * test passed: Jest's loader tolerates the cycle. Metro does not — it handed one
 * module an undefined `ApiClient` and the app died on `new ApiClient(...)`
 * before the first screen rendered.
 *
 * Importing the real modules in dependency order is what that failure would have
 * looked like, so the cycle cannot come back unnoticed.
 */

describe('startup module graph', () => {
  // The shared client is only constructed when a base URL is configured, and
  // that construction is the line a cycle crashes on. Without this the modules
  // would load with `apiClient` legitimately null and prove nothing.
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.test';
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
    else process.env.EXPO_PUBLIC_API_BASE_URL = originalBaseUrl;
    jest.restoreAllMocks();
  });

  /**
   * Loads a module in a fresh registry, so evaluation order is the real one
   * rather than whatever a previous test happened to cache.
   */
  function loadFresh<T>(load: () => T): T {
    let value!: T;
    jest.isolateModules(() => {
      value = load();
    });
    return value;
  }

  it('constructs the shared API client when it is loaded first', () => {
    const { apiClient, ApiClient } = loadFresh(() => require('@/api/client/api-client'));

    expect(ApiClient).toBeDefined();
    expect(apiClient).toBeInstanceOf(ApiClient);
  });

  it('loads the session manager without leaving the client half-built', () => {
    // session-manager imports api-client directly and reaches it again through
    // auth-refresh. Were that a cycle, one of the two would see undefined and
    // `new ApiClient(...)` would throw during this require.
    const graph = loadFresh(() => {
      const manager = require('@/services/session-manager');
      const refresh = require('@/api/endpoints/auth-refresh');
      const client = require('@/api/client/api-client');
      return { manager, refresh, client };
    });

    expect(typeof graph.manager.currentAccessToken).toBe('function');
    expect(typeof graph.refresh.refreshSession).toBe('function');
    expect(graph.client.apiClient).toBeInstanceOf(graph.client.ApiClient);
  });

  it('reaches the client through app-initialization, as startup does', () => {
    // The order the app itself uses: the bootstrap provider imports
    // app-initialization, which pulls in the endpoints and the session manager.
    const graph = loadFresh(() => {
      const init = require('@/services/app-initialization');
      const client = require('@/api/client/api-client');
      return { init, client };
    });

    expect(typeof graph.init.initializeApp).toBe('function');
    expect(graph.client.apiClient).toBeInstanceOf(graph.client.ApiClient);
  });

  it('authenticates requests once the session manager has been loaded', () => {
    // The providers are installed at module load rather than in a startup
    // effect, so there is no window in which a request goes out unauthenticated
    // because the app had not got round to wiring them up yet.
    const installed = loadFresh(() => {
      const calls: string[] = [];
      const client = require('@/api/client/api-client');
      jest.spyOn(client, 'installSessionTokens').mockImplementation(() => calls.push('installed'));
      require('@/services/session-manager');
      return calls;
    });

    expect(installed).not.toHaveLength(0);
  });
});
