import type { ScalekitUser } from './user';

/**
 * Storage type for persisting auth state
 */
export type StorageType = 'sessionStorage' | 'localStorage' | 'memory';

/**
 * Configuration for the Scalekit Auth SDK
 */
export interface ScalekitAuthConfig {
  /**
   * The Scalekit environment URL (e.g., https://your-tenant.scalekit.cloud)
   * All OIDC endpoints will be derived from this URL.
   */
  environmentUrl: string;

  /** The OAuth client ID registered in Scalekit */
  clientId: string;

  /** The URI to redirect to after authentication */
  redirectUri: string;

  /** Space-separated list of OIDC scopes. Defaults to "openid profile email offline_access" */
  scopes?: string;

  /** The URI to redirect to after logout */
  postLogoutRedirectUri?: string;

  /** Storage mechanism for auth state. Defaults to "sessionStorage" */
  storage?: StorageType;

  /** Whether to automatically handle the redirect callback. Defaults to true */
  autoHandleCallback?: boolean;

  /** Whether to enable silent token renewal. Defaults to true */
  automaticSilentRenew?: boolean;
}

/**
 * Options for the login redirect
 */
export interface LoginWithRedirectOptions {
  /** URL to return to after login */
  returnTo?: string;

  /** Scalekit organization ID for routing to org-specific IdP */
  organizationId?: string;

  /** Specific IdP connection ID to use */
  connectionId?: string;

  /** Pre-fill the email field in the login form */
  loginHint?: string;

  /** Additional query parameters to include in the auth request */
  extraQueryParams?: Record<string, string>;
}

/**
 * Options for popup login
 */
export interface LoginWithPopupOptions extends LoginWithRedirectOptions {
  /** Width of the popup window */
  popupWidth?: number;

  /** Height of the popup window */
  popupHeight?: number;
}

/**
 * Options for logout
 */
export interface LogoutOptions {
  /** Whether to perform a federated logout (logout from IdP as well) */
  federated?: boolean;

  /** Custom post-logout redirect URI (overrides default) */
  postLogoutRedirectUri?: string;

  /** Additional state to pass to the logout endpoint */
  state?: string;
}

/**
 * Options for getting an access token
 */
export interface GetAccessTokenOptions {
  /** Scopes to request (if different from initial config) */
  scopes?: string[];

  /** Whether to force a token refresh */
  forceRefresh?: boolean;
}

/**
 * App state that can be passed through the auth flow
 */
export interface AppState {
  returnTo?: string;
  [key: string]: unknown;
}

/**
 * Callback invoked after redirect authentication completes
 */
export type OnRedirectCallback = (result: {
  appState?: AppState;
  user?: ScalekitUser;
}) => void;

/**
 * Options for the Scalekit Auth plugin
 */
export interface ScalekitAuthPluginOptions extends ScalekitAuthConfig {
  /** Callback invoked after redirect authentication completes */
  onRedirectCallback?: OnRedirectCallback;

  /** Custom error handler for authentication errors */
  onError?: (error: Error) => void;
}
