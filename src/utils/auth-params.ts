import { OIDC_PARAMS, SCALEKIT_PARAMS } from '../constants';
import type { LoginWithRedirectOptions } from '../types';

/**
 * Checks if the current URL contains OIDC callback parameters
 */
export function hasAuthParams(searchParams?: string): boolean {
  const params = new URLSearchParams(searchParams ?? window.location.search);
  return params.has(OIDC_PARAMS.CODE) || params.has(OIDC_PARAMS.ERROR);
}

/**
 * Checks if the current URL contains an OIDC error
 */
export function hasAuthError(searchParams?: string): boolean {
  const params = new URLSearchParams(searchParams ?? window.location.search);
  return params.has(OIDC_PARAMS.ERROR);
}

/**
 * Gets auth error details from URL parameters
 */
export function getAuthError(searchParams?: string): { error: string; description?: string } | null {
  const params = new URLSearchParams(searchParams ?? window.location.search);
  const error = params.get(OIDC_PARAMS.ERROR);

  if (!error) {
    return null;
  }

  return {
    error,
    description: params.get(OIDC_PARAMS.ERROR_DESCRIPTION) ?? undefined,
  };
}

/**
 * Removes OIDC callback parameters from the URL
 */
export function cleanupAuthParams(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const paramsToRemove = [
    OIDC_PARAMS.CODE,
    OIDC_PARAMS.STATE,
    OIDC_PARAMS.ERROR,
    OIDC_PARAMS.ERROR_DESCRIPTION,
    OIDC_PARAMS.SESSION_STATE,
  ];

  let hasParams = false;
  paramsToRemove.forEach((param) => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      hasParams = true;
    }
  });

  if (hasParams) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * Builds extra query parameters for Scalekit-specific auth options
 */
export function buildScalekitParams(options: LoginWithRedirectOptions): Record<string, string> {
  const params: Record<string, string> = {};

  if (options.organizationId) {
    params[SCALEKIT_PARAMS.ORGANIZATION_ID] = options.organizationId;
  }

  if (options.connectionId) {
    params[SCALEKIT_PARAMS.CONNECTION_ID] = options.connectionId;
  }

  if (options.loginHint) {
    params[SCALEKIT_PARAMS.LOGIN_HINT] = options.loginHint;
  }

  // Merge with any additional extra params
  if (options.extraQueryParams) {
    Object.assign(params, options.extraQueryParams);
  }

  return params;
}

/**
 * Gets the current URL for use as return URL
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  return window.location.href;
}

/**
 * Normalizes a URL path to ensure it starts with /
 */
export function normalizeReturnPath(path: string): string {
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}
