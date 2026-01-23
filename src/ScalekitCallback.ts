import { defineComponent, ref, watch, h, type PropType, type VNode } from 'vue';
import { useScalekitAuth } from './useScalekitAuth';
import { hasAuthParams, hasAuthError, getAuthError } from './utils/auth-params';
import { CallbackError } from './types';

/**
 * Props for the ScalekitCallback component
 */
export interface ScalekitCallbackProps {
  /** Called when authentication succeeds */
  onSuccess?: () => void;

  /** Called when authentication fails */
  onError?: (error: Error) => void;
}

/**
 * Default loading content
 */
function DefaultLoading(): VNode {
  return h(
    'div',
    { style: { textAlign: 'center', padding: '2rem' } },
    h('p', {}, 'Processing authentication...')
  );
}

/**
 * Default error content
 */
function DefaultError(error: Error): VNode {
  return h(
    'div',
    { style: { textAlign: 'center', padding: '2rem', color: 'red' } },
    [
      h('p', {}, 'Authentication failed'),
      h('p', { style: { fontSize: '0.875rem' } }, error.message),
    ]
  );
}

/**
 * Component to handle the OIDC redirect callback.
 *
 * Place this component at your callback route (e.g., /callback).
 * It will automatically process the authentication response and call
 * the appropriate callbacks.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useRouter } from 'vue-router';
 * import { ScalekitCallback } from '@scalekit/vue-sdk';
 *
 * const router = useRouter();
 *
 * function handleSuccess() {
 *   router.push('/dashboard');
 * }
 *
 * function handleError(error) {
 *   console.error(error);
 *   router.push('/login?error=auth_failed');
 * }
 * </script>
 *
 * <template>
 *   <ScalekitCallback
 *     @success="handleSuccess"
 *     @error="handleError"
 *   >
 *     <template #loading>
 *       <CustomSpinner />
 *     </template>
 *     <template #error="{ error }">
 *       <CustomError :error="error" />
 *     </template>
 *   </ScalekitCallback>
 * </template>
 * ```
 */
export const ScalekitCallback = defineComponent({
  name: 'ScalekitCallback',

  props: {
    onSuccess: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: Error) => void>,
      default: undefined,
    },
  },

  emits: ['success', 'error'],

  setup(props, { emit, slots }) {
    const { handleRedirectCallback, isLoading: authLoading } = useScalekitAuth();
    const error = ref<Error | null>(null);
    const processed = ref(false);

    async function processCallback() {
      // Skip if already processed or still loading provider
      if (processed.value || authLoading.value) {
        return;
      }

      // Check for auth error in URL
      if (hasAuthError()) {
        const authError = getAuthError();
        const callbackError = new CallbackError(
          authError?.description || authError?.error || 'Authentication failed'
        );
        error.value = callbackError;
        processed.value = true;
        props.onError?.(callbackError);
        emit('error', callbackError);
        return;
      }

      // Check for auth params
      if (!hasAuthParams()) {
        const callbackError = new CallbackError(
          'No authentication parameters found in URL. ' +
            'This page should only be accessed after authentication redirect.'
        );
        error.value = callbackError;
        processed.value = true;
        props.onError?.(callbackError);
        emit('error', callbackError);
        return;
      }

      try {
        await handleRedirectCallback();
        processed.value = true;
        props.onSuccess?.();
        emit('success');
      } catch (err) {
        const callbackError =
          err instanceof Error ? err : new CallbackError('Unknown error during callback');
        error.value = callbackError;
        processed.value = true;
        props.onError?.(callbackError);
        emit('error', callbackError);
      }
    }

    // Watch for auth loading to complete
    watch(
      authLoading,
      () => {
        if (!authLoading.value && !processed.value) {
          processCallback();
        }
      },
      { immediate: true }
    );

    return () => {
      // Show error state
      if (error.value) {
        if (slots.error) {
          return slots.error({ error: error.value });
        }
        return DefaultError(error.value);
      }

      // Show loading state
      if (slots.loading) {
        return slots.loading();
      }

      return DefaultLoading();
    };
  },
});

export type ScalekitCallbackInstance = InstanceType<typeof ScalekitCallback>;
