/**
 * User profile information from OIDC claims
 */
export interface ScalekitUserProfile {
  /** Subject identifier (unique user ID) */
  sub: string;

  /** User's email address */
  email?: string;

  /** Whether the email has been verified */
  email_verified?: boolean;

  /** User's full name */
  name?: string;

  /** User's given/first name */
  given_name?: string;

  /** User's family/last name */
  family_name?: string;

  /** URL of the user's profile picture */
  picture?: string;

  /** User's locale preference */
  locale?: string;

  /** Time the user's information was last updated (Unix timestamp) */
  updated_at?: number;

  /** Additional custom claims */
  [key: string]: unknown;
}

/**
 * Scalekit-specific user metadata
 */
export interface ScalekitUserMetadata {
  /** The organization ID the user belongs to */
  organizationId?: string;

  /** The connection ID used for authentication */
  connectionId?: string;

  /** The identity provider used for authentication */
  identityProvider?: string;

  /** Roles assigned to the user */
  roles?: string[];

  /** Groups the user belongs to */
  groups?: string[];
}

/**
 * Complete user object returned by the SDK
 */
export interface ScalekitUser {
  /** User profile from OIDC claims */
  profile: ScalekitUserProfile;

  /** Scalekit-specific metadata */
  metadata: ScalekitUserMetadata;

  /** The ID token (JWT) */
  idToken: string;

  /** The access token */
  accessToken: string;

  /** When the access token expires (Date object) */
  expiresAt?: Date;

  /** The refresh token (if offline_access scope was requested) */
  refreshToken?: string;

  /** Scopes granted to the access token */
  scopes: string[];
}

/**
 * Creates a ScalekitUser from oidc-client-ts User object
 */
export function mapOidcUserToScalekitUser(oidcUser: {
  profile: Record<string, unknown>;
  id_token?: string;
  access_token: string;
  expires_at?: number;
  refresh_token?: string;
  scope?: string;
}): ScalekitUser {
  const profile = oidcUser.profile as ScalekitUserProfile;

  // Extract Scalekit-specific claims
  const metadata: ScalekitUserMetadata = {
    organizationId: profile['org_id'] as string | undefined,
    connectionId: profile['connection_id'] as string | undefined,
    identityProvider: profile['idp'] as string | undefined,
    roles: profile['roles'] as string[] | undefined,
    groups: profile['groups'] as string[] | undefined,
  };

  return {
    profile,
    metadata,
    idToken: oidcUser.id_token || '',
    accessToken: oidcUser.access_token,
    expiresAt: oidcUser.expires_at ? new Date(oidcUser.expires_at * 1000) : undefined,
    refreshToken: oidcUser.refresh_token,
    scopes: oidcUser.scope?.split(' ') || [],
  };
}
