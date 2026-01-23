# @scalekit/vue-sdk

Vue SDK for Scalekit OIDC authentication. Add enterprise SSO and authentication to your Vue 3 applications with ease.

## Features

- PKCE-enabled OAuth 2.0 / OIDC authentication
- Automatic token refresh
- Vue 3 Composition API composables
- Vue Router navigation guards
- TypeScript support with full type definitions
- Tree-shakeable ESM and CommonJS builds
- Federated logout support
- Organization and connection-specific login routing

## Installation

```bash
npm install @scalekit/vue-sdk
# or
yarn add @scalekit/vue-sdk
# or
pnpm add @scalekit/vue-sdk
```

## Quick Start

### 1. Install the Plugin

```ts
// main.ts
import { createApp } from 'vue';
import { ScalekitAuthPlugin } from '@scalekit/vue-sdk';
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(ScalekitAuthPlugin, {
  environmentUrl: 'https://your-tenant.scalekit.cloud',
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:5173/callback',
  postLogoutRedirectUri: 'http://localhost:5173',
});

app.use(router);
app.mount('#app');
```

### 2. Use the Composable

```vue
<script setup lang="ts">
import { useScalekitAuth } from '@scalekit/vue-sdk';

const {
  isLoading,
  isAuthenticated,
  user,
  error,
  loginWithRedirect,
  logout,
} = useScalekitAuth();
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else-if="!isAuthenticated">
    <button @click="loginWithRedirect()">Log in</button>
  </div>
  <div v-else>
    <p>Hello, {{ user?.profile.name }}</p>
    <button @click="logout()">Log out</button>
  </div>
</template>
```

### 3. Handle the Callback

```vue
<!-- views/CallbackView.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ScalekitCallback } from '@scalekit/vue-sdk';

const router = useRouter();

function handleSuccess() {
  router.push('/dashboard');
}

function handleError(error: Error) {
  console.error('Authentication failed:', error);
  router.push('/login?error=auth_failed');
}
</script>

<template>
  <ScalekitCallback @success="handleSuccess" @error="handleError">
    <template #loading>
      <div class="loading-spinner">Authenticating...</div>
    </template>
    <template #error="{ error }">
      <div class="error-message">{{ error.message }}</div>
    </template>
  </ScalekitCallback>
</template>
```

### 4. Protect Routes

```ts
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { createAuthGuard } from '@scalekit/vue-sdk';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/callback',
      component: () => import('./views/CallbackView.vue'),
    },
    {
      path: '/dashboard',
      component: () => import('./views/DashboardView.vue'),
      beforeEnter: createAuthGuard(),
    },
    {
      path: '/settings',
      component: () => import('./views/SettingsView.vue'),
      beforeEnter: createAuthGuard({
        organizationId: 'org_123', // Optional: route to specific org IdP
      }),
    },
  ],
});

export default router;
```

## API Reference

### ScalekitAuthPlugin

The Vue plugin that initializes authentication and provides it to all components.

```ts
app.use(ScalekitAuthPlugin, {
  // Required
  environmentUrl: string;    // Your Scalekit environment URL
  clientId: string;          // Your OAuth client ID
  redirectUri: string;       // Callback URL after authentication

  // Optional
  scopes?: string;           // OIDC scopes (default: "openid profile email offline_access")
  postLogoutRedirectUri?: string;  // URL after logout
  storage?: 'sessionStorage' | 'localStorage' | 'memory';  // Storage type (default: "sessionStorage")
  autoHandleCallback?: boolean;    // Auto-process callback (default: true)
  automaticSilentRenew?: boolean;  // Auto-refresh tokens (default: true)

  // Callbacks
  onRedirectCallback?: (result: { appState?: AppState; user?: ScalekitUser }) => void;
  onError?: (error: Error) => void;
});
```

### useScalekitAuth()

The main composable for accessing authentication state and methods.

```ts
const {
  // Reactive state (ComputedRef)
  isLoading,        // Whether the SDK is initializing
  isAuthenticated,  // Whether the user is authenticated
  user,             // The authenticated user object
  error,            // Any authentication error

  // Methods
  loginWithRedirect(options?),  // Redirect to login
  loginWithPopup(options?),     // Open login popup
  logout(options?),             // Log out the user
  getAccessToken(options?),     // Get current access token
  refreshToken(),               // Force token refresh
  handleRedirectCallback(),     // Process callback (usually automatic)
} = useScalekitAuth();
```

### useAccessToken()

Composable for managing access tokens.

```ts
const {
  accessToken,  // Ref<string | null> - Current access token
  isLoading,    // Ref<boolean> - Loading state
  error,        // Ref<Error | null> - Any error
  refresh,      // () => Promise<void> - Force refresh
} = useAccessToken();
```

### ScalekitCallback

Component to handle the OAuth callback.

```vue
<ScalekitCallback
  @success="onSuccess"
  @error="onError"
>
  <template #loading>
    <!-- Custom loading UI -->
  </template>
  <template #error="{ error }">
    <!-- Custom error UI -->
  </template>
</ScalekitCallback>
```

### createAuthGuard()

Creates a Vue Router navigation guard.

```ts
const guard = createAuthGuard({
  returnTo?: string;        // URL after auth (default: target route)
  organizationId?: string;  // Route to specific org IdP
  connectionId?: string;    // Route to specific connection
  loginHint?: string;       // Pre-fill email
  onRedirecting?: () => void;
});

// Use in route config
{
  path: '/protected',
  component: Protected,
  beforeEnter: createAuthGuard(),
}
```

## Login Options

### Login with Redirect

```ts
const { loginWithRedirect } = useScalekitAuth();

// Basic login
loginWithRedirect();

// With options
loginWithRedirect({
  returnTo: '/dashboard',        // Where to go after login
  organizationId: 'org_123',     // Route to org-specific IdP
  connectionId: 'conn_456',      // Route to specific connection
  loginHint: 'user@example.com', // Pre-fill email
  extraQueryParams: {            // Additional params
    prompt: 'login',
  },
});
```

### Login with Popup

```ts
const { loginWithPopup } = useScalekitAuth();

try {
  const user = await loginWithPopup({
    popupWidth: 500,
    popupHeight: 600,
    organizationId: 'org_123',
  });
  console.log('Logged in:', user);
} catch (error) {
  console.error('Popup login failed:', error);
}
```

## User Object

The `user` object contains:

```ts
interface ScalekitUser {
  profile: {
    sub: string;           // Unique user ID
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
    updated_at?: number;
  };
  metadata: {
    organizationId?: string;
    connectionId?: string;
    identityProvider?: string;
    roles?: string[];
    groups?: string[];
  };
  idToken: string;
  accessToken: string;
  expiresAt?: Date;
  refreshToken?: string;
  scopes: string[];
}
```

## Error Handling

The SDK provides typed error classes:

```ts
import {
  ScalekitAuthError,      // Base error class
  LoginError,             // Login failed
  LogoutError,            // Logout failed
  TokenRefreshError,      // Token refresh failed
  CallbackError,          // Callback processing failed
  ConfigurationError,     // Invalid configuration
  NotInitializedError,    // SDK not initialized
  NotAuthenticatedError,  // User not authenticated
} from '@scalekit/vue-sdk';

// Example usage
try {
  await loginWithRedirect();
} catch (error) {
  if (error instanceof LoginError) {
    console.error('Login failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Original error:', error.cause);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions. All types are exported:

```ts
import type {
  ScalekitAuthConfig,
  ScalekitAuthPluginOptions,
  ScalekitUser,
  ScalekitUserProfile,
  ScalekitUserMetadata,
  LoginWithRedirectOptions,
  LoginWithPopupOptions,
  LogoutOptions,
  GetAccessTokenOptions,
  AuthState,
  UseScalekitAuthReturn,
  UseAccessTokenReturn,
  AuthGuardOptions,
} from '@scalekit/vue-sdk';
```

## Requirements

- Vue 3.3+
- Vue Router 4+ (optional, for route guards)

## License

MIT

## Links

- [Scalekit Documentation](https://docs.scalekit.com)
- [GitHub Repository](https://github.com/scalekit-inc/scalekit-vue-sdk)
- [Report Issues](https://github.com/scalekit-inc/scalekit-vue-sdk/issues)
