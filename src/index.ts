// Plugin
export { ScalekitAuthPlugin, SCALEKIT_AUTH_KEY } from './plugin';
export type { ScalekitAuthInstance, ScalekitAuthMethods } from './plugin';

// Composables
export { useScalekitAuth } from './useScalekitAuth';
export type { UseScalekitAuthReturn } from './useScalekitAuth';
export { useAccessToken } from './useAccessToken';
export type { UseAccessTokenReturn } from './useAccessToken';

// Components
export { ScalekitCallback } from './ScalekitCallback';
export type { ScalekitCallbackProps, ScalekitCallbackInstance } from './ScalekitCallback';

// Route Guards
export { createAuthGuard, createGlobalAuthGuard, requiresAuth } from './authGuard';
export type { AuthGuardOptions } from './authGuard';

// Types - Config
export type {
  StorageType,
  ScalekitAuthConfig,
  ScalekitAuthPluginOptions,
  LoginWithRedirectOptions,
  LoginWithPopupOptions,
  LogoutOptions,
  GetAccessTokenOptions,
  AppState,
  OnRedirectCallback,
} from './types';

// Types - User
export type {
  ScalekitUser,
  ScalekitUserProfile,
  ScalekitUserMetadata,
} from './types';

// Types - Auth State
export type {
  AuthState,
  InitializingState,
  UnauthenticatedState,
  AuthenticatedState,
  ErrorState,
} from './types';

// Error classes
export {
  ScalekitAuthError,
  LoginError,
  TokenRefreshError,
  LogoutError,
  ConfigurationError,
  CallbackError,
  NotInitializedError,
  NotAuthenticatedError,
} from './types';
