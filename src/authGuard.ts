import { inject } from 'vue';
import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router';
import { SCALEKIT_AUTH_KEY } from './constants';
import type { ScalekitAuthInstance } from './plugin';
import type { LoginWithRedirectOptions } from './types';

/**
 * Options for the authentication guard
 */
export interface AuthGuardOptions {
  /** URL to return to after authentication (defaults to the target route) */
  returnTo?: string;

  /** Scalekit organization ID */
  organizationId?: string;

  /** Specific IdP connection ID */
  connectionId?: string;

  /** Pre-fill email hint */
  loginHint?: string;

  /** Callback when redirecting to login */
  onRedirecting?: () => void;
}

/**
 * Creates a Vue Router navigation guard that requires authentication.
 *
 * Use this guard to protect routes that require the user to be authenticated.
 * If the user is not authenticated, they will be redirected to the login page.
 *
 * @example
 * ```ts
 * // router/index.ts
 * import { createRouter, createWebHistory } from 'vue-router';
 * import { createAuthGuard } from '@scalekit/vue-sdk';
 *
 * const router = createRouter({
 *   history: createWebHistory(),
 *   routes: [
 *     {
 *       path: '/dashboard',
 *       component: Dashboard,
 *       beforeEnter: createAuthGuard(),
 *     },
 *     {
 *       path: '/settings',
 *       component: Settings,
 *       beforeEnter: createAuthGuard({
 *         organizationId: 'org_123',
 *       }),
 *     },
 *   ],
 * });
 * ```
 *
 * @param options Configuration options for the guard
 * @returns A Vue Router navigation guard
 */
export function createAuthGuard(
  options: AuthGuardOptions = {}
): NavigationGuardWithThis<undefined> {
  const {
    returnTo,
    organizationId,
    connectionId,
    loginHint,
    onRedirecting,
  } = options;

  return async function authGuard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized
  ) {
    // Note: This guard needs to be used in a component context
    // For global guards, use createAuthGuardWithAuth below
    const auth = inject<ScalekitAuthInstance>(SCALEKIT_AUTH_KEY);

    if (!auth) {
      console.error(
        'createAuthGuard: ScalekitAuthPlugin not installed. ' +
          'Make sure you have called app.use(ScalekitAuthPlugin, options).'
      );
      return false;
    }

    // Wait for auth to initialize
    if (auth.state.isLoading) {
      // Return a promise that resolves when auth is ready
      await new Promise<void>((resolve) => {
        const checkLoading = () => {
          if (!auth.state.isLoading) {
            resolve();
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
    }

    // User is authenticated, allow navigation
    if (auth.state.isAuthenticated) {
      return true;
    }

    // User is not authenticated, redirect to login
    const loginOptions: LoginWithRedirectOptions = {
      returnTo: returnTo ?? to.fullPath,
      organizationId,
      connectionId,
      loginHint,
    };

    onRedirecting?.();

    try {
      await auth.loginWithRedirect(loginOptions);
    } catch (error) {
      console.error('createAuthGuard: Failed to redirect to login', error);
    }

    // Prevent navigation while redirecting
    return false;
  };
}

/**
 * Creates a global authentication guard for use with router.beforeEach().
 *
 * This version accepts the auth instance directly, making it suitable for
 * global navigation guards where inject() is not available.
 *
 * @example
 * ```ts
 * // main.ts
 * import { createApp } from 'vue';
 * import { createRouter, createWebHistory } from 'vue-router';
 * import { ScalekitAuthPlugin, createGlobalAuthGuard } from '@scalekit/vue-sdk';
 *
 * const app = createApp(App);
 * const router = createRouter({ ... });
 *
 * // Install the plugin
 * app.use(ScalekitAuthPlugin, { ... });
 * app.use(router);
 *
 * // Get the auth instance and create guard
 * // Note: For global guards, you may need to access auth differently
 * // This is typically handled per-route with beforeEnter instead
 * ```
 *
 * @param auth The Scalekit auth instance
 * @param options Configuration options for the guard
 * @returns A Vue Router navigation guard function
 */
export function createGlobalAuthGuard(
  auth: ScalekitAuthInstance,
  options: AuthGuardOptions = {}
) {
  const {
    returnTo,
    organizationId,
    connectionId,
    loginHint,
    onRedirecting,
  } = options;

  return async function globalAuthGuard(
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized
  ): Promise<boolean> {
    // Wait for auth to initialize
    if (auth.state.isLoading) {
      await new Promise<void>((resolve) => {
        const checkLoading = () => {
          if (!auth.state.isLoading) {
            resolve();
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
    }

    // User is authenticated, allow navigation
    if (auth.state.isAuthenticated) {
      return true;
    }

    // User is not authenticated, redirect to login
    const loginOptions: LoginWithRedirectOptions = {
      returnTo: returnTo ?? to.fullPath,
      organizationId,
      connectionId,
      loginHint,
    };

    onRedirecting?.();

    try {
      await auth.loginWithRedirect(loginOptions);
    } catch (error) {
      console.error('globalAuthGuard: Failed to redirect to login', error);
    }

    return false;
  };
}

/**
 * Helper composable to check if a route requires authentication.
 *
 * Use this in your route meta to mark routes as requiring authentication.
 *
 * @example
 * ```ts
 * // router/index.ts
 * const routes = [
 *   {
 *     path: '/dashboard',
 *     component: Dashboard,
 *     meta: { requiresAuth: true },
 *   },
 * ];
 *
 * // Then in a global guard:
 * router.beforeEach((to) => {
 *   if (to.meta.requiresAuth) {
 *     // Check auth...
 *   }
 * });
 * ```
 */
export function requiresAuth(route: RouteLocationNormalized): boolean {
  return route.matched.some((record) => record.meta.requiresAuth === true);
}
