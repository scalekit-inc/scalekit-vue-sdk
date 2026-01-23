import type { ScalekitUser } from './user';

/**
 * Base state properties shared across all auth states
 */
interface BaseAuthState {
  /** Whether the SDK is still initializing */
  isLoading: boolean;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** The authenticated user, if any */
  user: ScalekitUser | null;

  /** Any error that occurred during authentication */
  error: Error | null;
}

/**
 * State when the SDK is initializing
 */
export interface InitializingState extends BaseAuthState {
  isLoading: true;
  isAuthenticated: false;
  user: null;
  error: null;
}

/**
 * State when the SDK has initialized but user is not authenticated
 */
export interface UnauthenticatedState extends BaseAuthState {
  isLoading: false;
  isAuthenticated: false;
  user: null;
  error: null;
}

/**
 * State when the user is authenticated
 */
export interface AuthenticatedState extends BaseAuthState {
  isLoading: false;
  isAuthenticated: true;
  user: ScalekitUser;
  error: null;
}

/**
 * State when an error occurred
 */
export interface ErrorState extends BaseAuthState {
  isLoading: false;
  isAuthenticated: false;
  user: null;
  error: Error;
}

/**
 * Discriminated union of all possible auth states
 */
export type AuthState =
  | InitializingState
  | UnauthenticatedState
  | AuthenticatedState
  | ErrorState;

/**
 * Auth action types for state management
 */
export type AuthAction =
  | { type: 'INITIALIZING' }
  | { type: 'INITIALIZED'; user: ScalekitUser | null }
  | { type: 'LOGIN_STARTED' }
  | { type: 'LOGIN_COMPLETED'; user: ScalekitUser }
  | { type: 'LOGOUT_COMPLETED' }
  | { type: 'TOKEN_REFRESHED'; user: ScalekitUser }
  | { type: 'ERROR'; error: Error };

/**
 * Initial state for the auth state
 */
export const initialAuthState: InitializingState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  error: null,
};

/**
 * Auth state reducer function
 */
export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INITIALIZING':
      return {
        isLoading: true,
        isAuthenticated: false,
        user: null,
        error: null,
      };

    case 'INITIALIZED':
      if (action.user) {
        return {
          isLoading: false,
          isAuthenticated: true,
          user: action.user,
          error: null,
        };
      }
      return {
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };

    case 'LOGIN_STARTED':
      return {
        isLoading: true,
        isAuthenticated: false,
        user: null,
        error: null,
      };

    case 'LOGIN_COMPLETED':
      return {
        isLoading: false,
        isAuthenticated: true,
        user: action.user,
        error: null,
      };

    case 'LOGOUT_COMPLETED':
      return {
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };

    case 'TOKEN_REFRESHED':
      return {
        isLoading: false,
        isAuthenticated: true,
        user: action.user,
        error: null,
      };

    case 'ERROR':
      return {
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.error,
      };

    default:
      return state;
  }
}
