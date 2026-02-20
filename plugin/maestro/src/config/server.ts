const DEFAULT_API_SCHEME = 'http';
const DEFAULT_API_HOST = '127.0.0.1';
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
