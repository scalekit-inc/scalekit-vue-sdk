import {
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client-ts';
import type { ScalekitAuthConfig } from '../types';
import { DEFAULT_SCOPES, RESPONSE_TYPE, STORAGE_KEY_PREFIX } from '../constants';
import { getStorage, createStateStore } from './storage';
import { ConfigurationError } from '../types/errors';

/**
 * Normalizes the environment URL by removing trailing slashes
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Builds Scalekit OIDC endpoints from the environment URL
 * These follow the standard Scalekit endpoint patterns.
 */
function buildScalekitEndpoints(environmentUrl: string) {
  const baseUrl = normalizeUrl(environmentUrl);

  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    userinfo_endpoint: `${baseUrl}/userinfo`,
    end_session_endpoint: `${baseUrl}/oidc/logout`,
    jwks_uri: `${baseUrl}/keys`,
    revocation_endpoint: `${baseUrl}/revoke`,
    introspection_endpoint: `${baseUrl}/oauth/introspect`,
  };
}

/**
 * Validates the SDK configuration
 */
function validateConfig(config: ScalekitAuthConfig): void {
  if (!config.environmentUrl) {
    throw new ConfigurationError('environmentUrl is required');
  }

  if (!config.clientId) {
    throw new ConfigurationError('clientId is required');
  }

  if (!config.redirectUri) {
    throw new ConfigurationError('redirectUri is required');
  }

  // Validate environment URL format
  try {
    new URL(config.environmentUrl);
  } catch {
    throw new ConfigurationError(`Invalid environmentUrl: ${config.environmentUrl}`);
  }

  // Validate redirect URI format
  try {
    new URL(config.redirectUri);
  } catch {
    throw new ConfigurationError(`Invalid redirectUri URL: ${config.redirectUri}`);
  }

  // Validate post-logout redirect URI if provided
  if (config.postLogoutRedirectUri) {
    try {
      new URL(config.postLogoutRedirectUri);
    } catch {
      throw new ConfigurationError(
        `Invalid postLogoutRedirectUri URL: ${config.postLogoutRedirectUri}`
      );
    }
  }
}

/**
 * Maps ScalekitAuthConfig to oidc-client-ts UserManagerSettings
 */
function mapConfigToSettings(config: ScalekitAuthConfig): UserManagerSettings {
  const storageType = config.storage ?? 'sessionStorage';
  const storage = getStorage(storageType);
  const stateStore = createStateStore(storageType);

  // Build explicit OIDC endpoints to avoid CORS issues with auto-discovery
  const endpoints = buildScalekitEndpoints(config.environmentUrl);

  return {
    // Authority (issuer)
    authority: endpoints.issuer,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,

    // PKCE settings (enabled by default)
    response_type: RESPONSE_TYPE,

    // Scopes
    scope: config.scopes ?? DEFAULT_SCOPES,

    // Post-logout settings
    post_logout_redirect_uri: config.postLogoutRedirectUri,

    // Token management
    automaticSilentRenew: config.automaticSilentRenew ?? true,

    // Storage
    userStore: new WebStorageStateStore({
      store: storage,
      prefix: STORAGE_KEY_PREFIX,
    }),
    stateStore,

    // Explicit OIDC metadata to avoid fetching .well-known/openid-configuration
    // This prevents CORS errors when the discovery endpoint is not accessible
    metadata: {
      issuer: endpoints.issuer,
      authorization_endpoint: endpoints.authorization_endpoint,
      token_endpoint: endpoints.token_endpoint,
      userinfo_endpoint: endpoints.userinfo_endpoint,
      end_session_endpoint: endpoints.end_session_endpoint,
      revocation_endpoint: endpoints.revocation_endpoint,
      introspection_endpoint: endpoints.introspection_endpoint,
    },
    metadataUrl: undefined, // Explicitly disable discovery

    // JWKS URI for token validation (oidc-client-ts will fetch this)
    // Note: If this also has CORS issues, tokens are validated server-side anyway
    signingKeys: undefined,

    // Load user info from userinfo endpoint
    loadUserInfo: true,

    // Disable monitoring session (not needed for most SPAs)
    monitorSession: false,

    // Filter OIDC protocol claims from user profile
    filterProtocolClaims: true,
  };
}

/**
 * Creates a configured UserManager instance
 */
export function createUserManager(config: ScalekitAuthConfig): UserManager {
  validateConfig(config);
  const settings = mapConfigToSettings(config);
  return new UserManager(settings);
}

/**
 * Gets the stored user from the UserManager without making network requests
 */
export async function getStoredUser(userManager: UserManager) {
  try {
    const user = await userManager.getUser();
    return user;
  } catch {
    return null;
  }
}
