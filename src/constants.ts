/**
 * Default OIDC scopes requested by the SDK
 */
export const DEFAULT_SCOPES = 'openid profile email offline_access';

/**
 * Response type for PKCE authorization code flow
 */
export const RESPONSE_TYPE = 'code';

/**
 * Storage key prefix for the SDK
 */
export const STORAGE_KEY_PREFIX = 'scalekit_auth';

/**
 * Query parameter names used in OIDC flows
 */
export const OIDC_PARAMS = {
  CODE: 'code',
  STATE: 'state',
  ERROR: 'error',
  ERROR_DESCRIPTION: 'error_description',
  SESSION_STATE: 'session_state',
} as const;

/**
 * Scalekit-specific query parameter names
 */
export const SCALEKIT_PARAMS = {
  ORGANIZATION_ID: 'organization_id',
  CONNECTION_ID: 'connection_id',
  LOGIN_HINT: 'login_hint',
} as const;

/**
 * Default popup window dimensions
 */
export const DEFAULT_POPUP_CONFIG = {
  WIDTH: 500,
  HEIGHT: 600,
} as const;

/**
 * Silent renew interval buffer (in seconds before expiry)
 */
export const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

/**
 * Injection key for the Scalekit auth instance
 */
export const SCALEKIT_AUTH_KEY = Symbol('scalekit-auth');
