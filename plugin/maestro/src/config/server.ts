export const MAESTRO_SERVER_URL = 'http://127.0.0.1:5000';

export function buildServerUrl(path: string): string {
  return `${MAESTRO_SERVER_URL}${path}`;
}
