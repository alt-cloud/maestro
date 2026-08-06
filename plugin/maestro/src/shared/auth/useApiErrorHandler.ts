import { useCallback } from 'react';
import { MaestroApiError } from '../utils/apiClient';
import { useApiKey } from './ApiKeyContext';

/**
 * Hook that wraps async API calls and automatically handles auth errors.
 *
 * Usage:
 *   const safeApiCall = useApiErrorHandler();
 *
 */
export function useApiErrorHandler() {
  const { requestKey, hasKey } = useApiKey();

  return useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T> => {
      try {
        return await apiCall();
      } catch (error) {
        if (error instanceof MaestroApiError) {
          // No API key configured
          if (error.status === 0 && error.statusText === 'NO_API_KEY') {
            requestKey('Please enter your Maestro API key to continue.');
            throw error;
          }

          // Authentication failed — key is invalid or expired
          if (error.isAuthError()) {
            requestKey(
              error.status === 401
                ? 'Your API key was rejected by the server. Please enter a valid key.'
                : `Access denied: ${error.toUserMessage()}`
            );
            throw error;
          }
        }
        // Re-throw other errors
        throw error;
      }
    },
    [requestKey, hasKey]
  );
}
