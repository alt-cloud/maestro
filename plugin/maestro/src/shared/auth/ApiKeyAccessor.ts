import { loadApiKey } from './ApiKeyStorage';

/**
 * Bridge between non-React code (apiClient) and the API key storage.
 *
 * This function reads the key directly from localStorage, bypassing React Context.
 * It's used by apiClient.ts which cannot use React hooks.
 *
 * The ApiKeyProvider keeps this in sync via storage events, so the value
 * returned here is always up-to-date.
 */
export function getApiKeyFromStorage(): string | null {
  const stored = loadApiKey();
  return stored?.key ?? null;
}
