import { reactive, readonly, type App, type DeepReadonly } from 'vue';
import { UserManager, User } from 'oidc-client-ts';
import { SCALEKIT_AUTH_KEY, DEFAULT_POPUP_CONFIG } from './constants';
import {
  type ScalekitAuthPluginOptions,
  type ScalekitUser,
  type LoginWithRedirectOptions,
  type LoginWithPopupOptions,
  type LogoutOptions,
  type GetAccessTokenOptions,
  type AuthState,
  mapOidcUserToScalekitUser,
  initialAuthState,
  LoginError,
  LogoutError,
  TokenRefreshError,
  CallbackError,
  NotAuthenticatedError,
} from './types';
import { createUserManager } from './utils/user-manager-factory';
import {
  hasAuthParams,
  cleanupAuthParams,
  buildScalekitParams,
} from './utils/auth-params';

/**
 * Methods available on the auth instance
 */
export interface ScalekitAuthMethods {
  /**
   * Initiates login by redirecting to the authorization server
   */
  loginWithRedirect: (options?: LoginWithRedirectOptions) => Promise<void>;

  /**
   * Initiates login in a popup window
   */
  loginWithPopup: (options?: LoginWithPopupOptions) => Promise<ScalekitUser>;

  /**
   * Logs the user out
   */
  logout: (options?: LogoutOptions) => Promise<void>;

  /**
   * Gets the current access token, refreshing if necessary
   */
  getAccessToken: (options?: GetAccessTokenOptions) => Promise<string>;

  /**
   * Silently refreshes the access token
   */
  refreshToken: () => Promise<ScalekitUser | null>;

  /**
   * Handles the redirect callback (usually called automatically)
   */
  handleRedirectCallback: () => Promise<ScalekitUser>;
}

/**
 * Complete auth instance interface
 */
export interface ScalekitAuthInstance extends ScalekitAuthMethods {
  /** Reactive authentication state (readonly) */
  state: DeepReadonly<AuthState>;

  /** The underlying UserManager instance (for advanced use cases) */
  userManager: UserManager | null;
}

/**
 * Creates the Scalekit auth instance
 */
function createScalekitAuth(options: ScalekitAuthPluginOptions): ScalekitAuthInstance {
  const {
    onRedirectCallback,
    onError,
    autoHandleCallback = true,
    ...config
  } = options;

  // Create reactive state
  const state = reactive<AuthState>({ ...initialAuthState });

  // Create UserManager
  let userManager: UserManager | null = null;

  /**
   * Dispatch an action to update state
   */
  function dispatch(action: { type: string; user?: ScalekitUser | null; error?: Error }) {
    switch (action.type) {
      case 'INITIALIZING':
        state.isLoading = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        break;

      case 'INITIALIZED':
        state.isLoading = false;
        if (action.user) {
          state.isAuthenticated = true;
          state.user = action.user;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
        state.error = null;
        break;

      case 'LOGIN_STARTED':
        state.isLoading = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        break;

      case 'LOGIN_COMPLETED':
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.user!;
        state.error = null;
        break;

      case 'LOGOUT_COMPLETED':
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        break;

      case 'TOKEN_REFRESHED':
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.user!;
        state.error = null;
        break;

      case 'ERROR':
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.error!;
        break;
    }
  }

  /**
   * Handle redirect callback
   */
  async function handleRedirectCallback(): Promise<ScalekitUser> {
    if (!userManager) {
      throw new CallbackError('UserManager not initialized');
    }

    try {
      const oidcUser = await userManager.signinRedirectCallback();
      const scalekitUser = mapOidcUserToScalekitUser(oidcUser);

      dispatch({ type: 'LOGIN_COMPLETED', user: scalekitUser });
      cleanupAuthParams();

      return scalekitUser;
    } catch (error) {
      const callbackError = new CallbackError(
        'Failed to process authentication callback',
        error instanceof Error ? error : undefined
      );
      dispatch({ type: 'ERROR', error: callbackError });
      throw callbackError;
    }
  }

  /**
   * Initialize the auth instance
   */
  async function initialize() {
    userManager = createUserManager(config);

    // Set up event listeners
    userManager.events.addUserLoaded((oidcUser: User) => {
      const scalekitUser = mapOidcUserToScalekitUser(oidcUser);
      dispatch({ type: 'TOKEN_REFRESHED', user: scalekitUser });
    });

    userManager.events.addUserUnloaded(() => {
      dispatch({ type: 'LOGOUT_COMPLETED' });
    });

    userManager.events.addSilentRenewError((error: Error) => {
      const refreshError = new TokenRefreshError('Silent token renewal failed', error);
      dispatch({ type: 'ERROR', error: refreshError });
      onError?.(refreshError);
    });

    userManager.events.addAccessTokenExpired(() => {
      dispatch({ type: 'LOGOUT_COMPLETED' });
    });

    try {
      // Check if we're handling a redirect callback
      if (autoHandleCallback && hasAuthParams()) {
        const user = await handleRedirectCallback();
        onRedirectCallback?.({
          user,
          appState: undefined,
        });
        return;
      }

      // Check for existing session
      const oidcUser = await userManager.getUser();
      if (oidcUser && !oidcUser.expired) {
        const scalekitUser = mapOidcUserToScalekitUser(oidcUser);
        dispatch({ type: 'INITIALIZED', user: scalekitUser });
      } else {
        dispatch({ type: 'INITIALIZED', user: null });
      }
    } catch (error) {
      const initError = error instanceof Error ? error : new Error('Initialization failed');
      dispatch({ type: 'ERROR', error: initError });
      onError?.(initError);
    }
  }

  /**
   * Login with redirect
   */
  async function loginWithRedirect(options: LoginWithRedirectOptions = {}): Promise<void> {
    if (!userManager) {
      throw new LoginError('UserManager not initialized');
    }

    try {
      dispatch({ type: 'LOGIN_STARTED' });

      const extraQueryParams = buildScalekitParams(options);

      await userManager.signinRedirect({
        state: options.returnTo ? { returnTo: options.returnTo } : undefined,
        extraQueryParams:
          Object.keys(extraQueryParams).length > 0 ? extraQueryParams : undefined,
      });
    } catch (error) {
      const loginError = new LoginError(
        'Failed to initiate login',
        error instanceof Error ? error : undefined
      );
      dispatch({ type: 'ERROR', error: loginError });
      throw loginError;
    }
  }

  /**
   * Login with popup
   */
  async function loginWithPopup(options: LoginWithPopupOptions = {}): Promise<ScalekitUser> {
    if (!userManager) {
      throw new LoginError('UserManager not initialized');
    }

    try {
      dispatch({ type: 'LOGIN_STARTED' });

      const extraQueryParams = buildScalekitParams(options);
      const popupWidth = options.popupWidth ?? DEFAULT_POPUP_CONFIG.WIDTH;
      const popupHeight = options.popupHeight ?? DEFAULT_POPUP_CONFIG.HEIGHT;

      const oidcUser = await userManager.signinPopup({
        popupWindowFeatures: {
          width: popupWidth,
          height: popupHeight,
        },
        extraQueryParams:
          Object.keys(extraQueryParams).length > 0 ? extraQueryParams : undefined,
      });

      const scalekitUser = mapOidcUserToScalekitUser(oidcUser);
      dispatch({ type: 'LOGIN_COMPLETED', user: scalekitUser });

      return scalekitUser;
    } catch (error) {
      const loginError = new LoginError(
        'Popup login failed',
        error instanceof Error ? error : undefined
      );
      dispatch({ type: 'ERROR', error: loginError });
      throw loginError;
    }
  }

  /**
   * Logout
   */
  async function logout(options: LogoutOptions = {}): Promise<void> {
    if (!userManager) {
      throw new LogoutError('UserManager not initialized');
    }

    try {
      await userManager.signoutRedirect({
        post_logout_redirect_uri: options.postLogoutRedirectUri,
        state: options.state,
      });
    } catch (error) {
      const logoutError = new LogoutError(
        'Logout failed',
        error instanceof Error ? error : undefined
      );
      dispatch({ type: 'ERROR', error: logoutError });
      throw logoutError;
    }
  }

  /**
   * Get access token
   */
  async function getAccessToken(options: GetAccessTokenOptions = {}): Promise<string> {
    if (!userManager) {
      throw new NotAuthenticatedError('UserManager not initialized');
    }

    try {
      let oidcUser = await userManager.getUser();

      if (!oidcUser) {
        throw new NotAuthenticatedError();
      }

      // Force refresh if requested or if token is expired
      if (options.forceRefresh || oidcUser.expired) {
        oidcUser = await userManager.signinSilent();
        if (!oidcUser) {
          throw new TokenRefreshError('Silent refresh returned no user');
        }
      }

      return oidcUser.access_token;
    } catch (error) {
      if (error instanceof NotAuthenticatedError) {
        throw error;
      }
      throw new TokenRefreshError(
        'Failed to get access token',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Refresh token
   */
  async function refreshToken(): Promise<ScalekitUser | null> {
    if (!userManager) {
      return null;
    }

    try {
      const oidcUser = await userManager.signinSilent();
      if (oidcUser) {
        const scalekitUser = mapOidcUserToScalekitUser(oidcUser);
        dispatch({ type: 'TOKEN_REFRESHED', user: scalekitUser });
        return scalekitUser;
      }
      return null;
    } catch (error) {
      const refreshError = new TokenRefreshError(
        'Token refresh failed',
        error instanceof Error ? error : undefined
      );
      dispatch({ type: 'ERROR', error: refreshError });
      throw refreshError;
    }
  }

  // Initialize immediately
  initialize();

  return {
    state: readonly(state) as DeepReadonly<AuthState>,
    userManager,
    loginWithRedirect,
    loginWithPopup,
    logout,
    getAccessToken,
    refreshToken,
    handleRedirectCallback,
  };
}

/**
 * Scalekit Auth Plugin for Vue
 *
 * @example
 * ```ts
 * import { createApp } from 'vue';
 * import { ScalekitAuthPlugin } from '@scalekit/vue-sdk';
 *
 * const app = createApp(App);
 *
 * app.use(ScalekitAuthPlugin, {
 *   environmentUrl: 'https://your-tenant.scalekit.cloud',
 *   clientId: 'your-client-id',
 *   redirectUri: 'http://localhost:3000/callback',
 * });
 *
 * app.mount('#app');
 * ```
 */
export const ScalekitAuthPlugin = {
  install(app: App, options: ScalekitAuthPluginOptions) {
    const auth = createScalekitAuth(options);
    app.provide(SCALEKIT_AUTH_KEY, auth);
  },
};

export { SCALEKIT_AUTH_KEY };
