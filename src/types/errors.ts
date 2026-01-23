/**
 * Base error class for Scalekit authentication errors
 */
export class ScalekitAuthError extends Error {
  /** Original error that caused this error, if any */
  public readonly cause?: Error;

  /** Error code for programmatic handling */
  public readonly code: string;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = 'ScalekitAuthError';
    this.code = code;
    this.cause = cause;

    // Maintains proper stack trace for where error was thrown (only in V8)
    const ErrorWithCapture = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: Function) => void;
    };
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when login fails
 */
export class LoginError extends ScalekitAuthError {
  constructor(message: string, cause?: Error) {
    super(message, 'LOGIN_ERROR', cause);
    this.name = 'LoginError';
  }
}

/**
 * Error thrown when token refresh fails
 */
export class TokenRefreshError extends ScalekitAuthError {
  constructor(message: string, cause?: Error) {
    super(message, 'TOKEN_REFRESH_ERROR', cause);
    this.name = 'TokenRefreshError';
  }
}

/**
 * Error thrown when logout fails
 */
export class LogoutError extends ScalekitAuthError {
  constructor(message: string, cause?: Error) {
    super(message, 'LOGOUT_ERROR', cause);
    this.name = 'LogoutError';
  }
}

/**
 * Error thrown when the SDK is misconfigured
 */
export class ConfigurationError extends ScalekitAuthError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIGURATION_ERROR', cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when a callback processing fails
 */
export class CallbackError extends ScalekitAuthError {
  constructor(message: string, cause?: Error) {
    super(message, 'CALLBACK_ERROR', cause);
    this.name = 'CallbackError';
  }
}

/**
 * Error thrown when trying to use auth methods before initialization
 */
export class NotInitializedError extends ScalekitAuthError {
  constructor() {
    super(
      'Scalekit Auth SDK is not initialized. Make sure you have installed the ScalekitAuthPlugin.',
      'NOT_INITIALIZED_ERROR'
    );
    this.name = 'NotInitializedError';
  }
}

/**
 * Error thrown when the user is not authenticated but auth is required
 */
export class NotAuthenticatedError extends ScalekitAuthError {
  constructor(message = 'User is not authenticated') {
    super(message, 'NOT_AUTHENTICATED_ERROR');
    this.name = 'NotAuthenticatedError';
  }
}
