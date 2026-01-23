// Config types
export type {
  StorageType,
  ScalekitAuthConfig,
  LoginWithRedirectOptions,
  LoginWithPopupOptions,
  LogoutOptions,
  GetAccessTokenOptions,
  AppState,
  OnRedirectCallback,
  ScalekitAuthPluginOptions,
} from './config';

// User types
export type {
  ScalekitUserProfile,
  ScalekitUserMetadata,
  ScalekitUser,
} from './user';
export { mapOidcUserToScalekitUser } from './user';

// Auth state types
export type {
  AuthState,
  AuthAction,
  InitializingState,
  UnauthenticatedState,
  AuthenticatedState,
  ErrorState,
} from './auth-state';
export { initialAuthState, authReducer } from './auth-state';

// Error types
export {
  ScalekitAuthError,
  LoginError,
  TokenRefreshError,
  LogoutError,
  ConfigurationError,
  CallbackError,
  NotInitializedError,
  NotAuthenticatedError,
} from './errors';
