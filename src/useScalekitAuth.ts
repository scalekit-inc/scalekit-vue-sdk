import { inject, computed, type ComputedRef } from 'vue';
import { SCALEKIT_AUTH_KEY } from './constants';
import type { ScalekitAuthInstance } from './plugin';
import type {
  ScalekitUser,
  LoginWithRedirectOptions,
  LoginWithPopupOptions,
  LogoutOptions,
  GetAccessTokenOptions,
} from './types';

/**
 * Return type for the useScalekitAuth composable
 */
export interface UseScalekitAuthReturn {
  /** Whether the SDK is still initializing */
  isLoading: ComputedRef<boolean>;

  /** Whether the user is authenticated */
  isAuthenticated: ComputedRef<boolean>;

  /** The authenticated user, if any */
  user: ComputedRef<ScalekitUser | null>;

  /** Any error that occurred during authentication */
  error: ComputedRef<Error | null>;

  /** Initiates login by redirecting to the authorization server */
  loginWithRedirect: (options?: LoginWithRedirectOptions) => Promise<void>;

  /** Initiates login in a popup window */
  loginWithPopup: (options?: LoginWithPopupOptions) => Promise<ScalekitUser>;

  /** Logs the user out */
  logout: (options?: LogoutOptions) => Promise<void>;

  /** Gets the current access token, refreshing if necessary */
  getAccessToken: (options?: GetAccessTokenOptions) => Promise<string>;

  /** Silently refreshes the access token */
  refreshToken: () => Promise<ScalekitUser | null>;

  /** Handles the redirect callback (usually called automatically) */
  handleRedirectCallback: () => Promise<ScalekitUser>;
}

/**
 * Composable to access Scalekit authentication state and methods.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useScalekitAuth } from '@scalekit/vue-sdk';
 *
 * const {
 *   isLoading,
 *   isAuthenticated,
 *   user,
 *   error,
 *   loginWithRedirect,
 *   logout,
 * } = useScalekitAuth();
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else-if="!isAuthenticated">
 *     <button @click="loginWithRedirect()">Log in</button>
 *   </div>
 *   <div v-else>
 *     <p>Hello, {{ user?.profile.name }}</p>
 *     <button @click="logout()">Log out</button>
 *   </div>
 * </template>
 * ```
 *
 * @returns The authentication state and methods
 */
export function useScalekitAuth(): UseScalekitAuthReturn {
  const auth = inject<ScalekitAuthInstance>(SCALEKIT_AUTH_KEY);

  if (!auth) {
    throw new Error(
      'useScalekitAuth must be used within a Vue app that has installed the ScalekitAuthPlugin. ' +
        'Make sure you have called app.use(ScalekitAuthPlugin, options) before using this composable.'
    );
  }

  return {
    isLoading: computed(() => auth.state.isLoading),
    isAuthenticated: computed(() => auth.state.isAuthenticated),
    user: computed(() => auth.state.user as ScalekitUser | null),
    error: computed(() => auth.state.error as Error | null),
    loginWithRedirect: auth.loginWithRedirect,
    loginWithPopup: auth.loginWithPopup,
    logout: auth.logout,
    getAccessToken: auth.getAccessToken,
    refreshToken: auth.refreshToken,
    handleRedirectCallback: auth.handleRedirectCallback,
  };
}
