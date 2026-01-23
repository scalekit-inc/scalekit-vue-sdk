import { ref, watch, type Ref } from 'vue';
import { useScalekitAuth } from './useScalekitAuth';

/**
 * Return type for the useAccessToken composable
 */
export interface UseAccessTokenReturn {
  /** The current access token, or null if not available */
  accessToken: Ref<string | null>;

  /** Whether the token is being fetched */
  isLoading: Ref<boolean>;

  /** Any error that occurred while fetching the token */
  error: Ref<Error | null>;

  /** Manually refresh the token */
  refresh: () => Promise<void>;
}

/**
 * Composable to get and manage the current access token.
 *
 * This composable automatically fetches the access token when the user is authenticated
 * and provides a method to manually refresh it.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAccessToken } from '@scalekit/vue-sdk';
 *
 * const { accessToken, isLoading, error, refresh } = useAccessToken();
 *
 * async function callApi() {
 *   if (!accessToken.value) return;
 *
 *   const response = await fetch('/api/data', {
 *     headers: {
 *       Authorization: `Bearer ${accessToken.value}`,
 *     },
 *   });
 *   // Handle response...
 * }
 * </script>
 *
 * <template>
 *   <div v-if="isLoading">Loading token...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else>
 *     <button @click="callApi">Call API</button>
 *     <button @click="refresh">Refresh Token</button>
 *   </div>
 * </template>
 * ```
 *
 * @returns Object containing the token, loading state, error, and refresh function
 */
export function useAccessToken(): UseAccessTokenReturn {
  const { isAuthenticated, user, getAccessToken, isLoading: authLoading } = useScalekitAuth();

  const accessToken = ref<string | null>(null);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  /**
   * Fetch the access token
   */
  async function fetchToken() {
    if (!isAuthenticated.value || authLoading.value) {
      if (!authLoading.value) {
        isLoading.value = false;
        accessToken.value = null;
      }
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await getAccessToken();
      accessToken.value = token;
      isLoading.value = false;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to get access token');
      accessToken.value = null;
      isLoading.value = false;
    }
  }

  /**
   * Manual refresh function
   */
  async function refresh(): Promise<void> {
    if (!isAuthenticated.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const token = await getAccessToken({ forceRefresh: true });
      accessToken.value = token;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to refresh access token');
    } finally {
      isLoading.value = false;
    }
  }

  // Watch for authentication changes and fetch token
  watch(
    [isAuthenticated, authLoading, user],
    () => {
      fetchToken();
    },
    { immediate: true }
  );

  return {
    accessToken,
    isLoading,
    error,
    refresh,
  };
}
