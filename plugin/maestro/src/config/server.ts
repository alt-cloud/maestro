const DEFAULT_API_SCHEME = 'http';
const DEFAULT_API_HOST = 'localhost';
const DEFAULT_API_PORT = '5000';

function getEnvValue(name: string): string | undefined {
  if (typeof process === 'undefined' || typeof process.env === 'undefined') {
    return undefined;
  }

  const value = process.env[name];
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeScheme(value: string | undefined): string {
  const nextValue = (value || DEFAULT_API_SCHEME).toLowerCase();
  return nextValue === 'https' ? 'https' : 'http';
}

function normalizePort(value: string | undefined): string {
  const nextValue = value || DEFAULT_API_PORT;
  const parsed = Number(nextValue);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return DEFAULT_API_PORT;
  }
  return String(parsed);
}

const apiScheme = normalizeScheme(
  getEnvValue('MAESTRO_API_SCHEME') || getEnvValue('REACT_APP_MAESTRO_API_SCHEME')
);
const apiHost =
  getEnvValue('MAESTRO_API_HOST') || getEnvValue('REACT_APP_MAESTRO_API_HOST') || DEFAULT_API_HOST;
const apiPort = normalizePort(
  getEnvValue('MAESTRO_API_PORT') || getEnvValue('REACT_APP_MAESTRO_API_PORT')
);

export const MAESTRO_SERVER_URL = `${apiScheme}://${apiHost}:${apiPort}`;

export function buildServerUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${MAESTRO_SERVER_URL}${normalizedPath}`;
}

/**
 * REST API key for authentication.
 * Sent in the `X-API-Key` header for all API requests.
 *
 * SECURITY: This key is embedded in the plugin bundle at build time.
 * Ensure the plugin is only served to trusted users.
 *
 * @throws {Error} if MAESTRO_API_KEY is not set.
 */
// NOTE: MAESTRO_API_KEY environment variable is intentionally NOT supported.
// API keys must be entered via the plugin UI (ApiKeyModal) and are stored
// in localStorage. This prevents key leakage via:
// - JavaScript bundle inspection (keys would be visible in compiled JS)
// - Server logs, browser history, Referer headers (if passed via URL)
// - Shared build artifacts
// export function getApiKey(): string {
//   const key =
//     getEnvValue('MAESTRO_API_KEY') || getEnvValue('REACT_APP_MAESTRO_API_KEY') || 'super-admin-key-abcdefghijklmnopqrst';
//     // alert('key=' + key);
//
//   if (!key) {
//     throw new Error(
//       '[Maestro] MAESTRO_API_KEY environment variable is not set. ' +
//       'The backend requires authentication. ' +
//       'Set it in your .env file or Headlamp plugin configuration.'
//     );
//   }
//
//   return key;
// }

/**
 * Check if API key is configured without throwing.
 */
// export function hasApiKey(): boolean {
//   const key =
//     getEnvValue('MAESTRO_API_KEY') || getEnvValue('REACT_APP_MAESTRO_API_KEY') || '';
//   return key.length > 0;
// }
