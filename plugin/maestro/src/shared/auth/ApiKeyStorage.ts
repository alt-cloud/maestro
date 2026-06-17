/**
 * Persistent storage for the Maestro API key.
 *
 * SECURITY NOTES:
 * - localStorage is same-origin isolated (protected by our CSP policy on backend).
 * - Key is NEVER logged.
 * - Key is NEVER included in URLs.
 * - Cleared automatically on 401 response to prevent retry loops with invalid key.
 */

const STORAGE_KEY = 'maestro_api_key';
const STORAGE_VERSION = '1';

export interface StoredApiKey {
  key: string;
  /** Unix timestamp (ms) when the key was saved */
  savedAt: number;
  /** Storage schema version for future migrations */
  version: string;
  /** Optional user-provided label (e.g., "Production key") */
  label?: string;
}

/**
 * Read stored API key from localStorage.
 * Returns null if not present or corrupted.
 */
export function loadApiKey(): StoredApiKey | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredApiKey>;
    if (
      typeof parsed.key !== 'string' ||
      typeof parsed.savedAt !== 'number' ||
      parsed.version !== STORAGE_VERSION
    ) {
      // Corrupted or outdated — discard
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed as StoredApiKey;
  } catch (error) {
    console.warn('[Maestro] Failed to read API key from storage:', error);
    return null;
  }
}

/**
 * Save API key to localStorage.
 */
export function saveApiKey(key: string, label?: string): StoredApiKey {
  const stored: StoredApiKey = {
    key,
    savedAt: Date.now(),
    version: STORAGE_VERSION,
    label,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      // localStorage might be full or disabled (private browsing)
      console.error('[Maestro] Failed to save API key to storage:', error);
    }
  }

  return stored;
}

/**
 * Remove API key from localStorage.
 */
export function clearApiKey(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[Maestro] Failed to clear API key from storage:', error);
    }
  }
}

/**
 * Mask API key for safe display (show first 4 and last 4 chars).
 * Example: "abcdef1234567890" → "abcd...7890"
 */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}${'•'.repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`;
}
