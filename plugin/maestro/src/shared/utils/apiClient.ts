import { maestroConfig } from '../../maestroConfig';
import { getApiKeyFromStorage } from '../auth/ApiKeyAccessor';

/**
 * Maestro API Client
 *
 * Centralized HTTP client that automatically:
 * - Attaches the `X-API-Key` header to every request
 * - Normalizes errors into a typed `MaestroApiError`
 * - Supports AbortSignal for cancellation
 * - Supports both JSON and blob responses
 */

// === ERROR TYPES ===

export class MaestroApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly endpoint: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'MaestroApiError';
  }

  isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  toUserMessage(): string {
    if (this.status === 401) {
      return 'Authentication required. Please check the MAESTRO_API_KEY configuration.';
    }
    if (this.status === 403) {
      const reason =
        (this.details as { error?: string } | undefined)?.error ||
        'Access denied. The API key may be expired, lack required permissions, or be invalid.';
      return reason;
    }
    if (this.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (this.status >= 500) {
      return `Server error (${this.status}). Please try again later.`;
    }
    return `${this.message} (HTTP ${this.status})`;
  }
}

// === TYPES ===

export interface ApiRequestOptions {
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// === INTERNAL HELPERS ===

function buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
 const apiKey = getApiKeyFromStorage();
  if (!apiKey) {
    // This error is caught by the caller and triggers the modal
    throw new MaestroApiError(
      'API key is not configured',
      0,
      'NO_API_KEY',
      'client'
    );
  }

  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  };
}

function buildFullUrl(path: string, queryParams?: Record<string, string>): string {
  const baseUrl = maestroConfig.getBaseUrl();

  if (!baseUrl) {
    throw new Error('Конфигурация Maestro ещё не загружена.');
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let fullUrl = `${baseUrl}${normalizedPath}`;

  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const queryString = params.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  return fullUrl;
}

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text || response.statusText;
    }
  } catch {
    return response.statusText;
  }
}

// === PUBLIC API ===

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: ApiRequestOptions = {}
): Promise<T> {
  let headers: Record<string, string>;
  try {
    headers = buildHeaders(options.headers);
  } catch (error) {
    throw error;
  }

  const url = buildFullUrl(path, options.queryParams);

  const init: RequestInit = {
    method,
    headers,
    signal: options.signal,
    credentials: 'same-origin',
    // Every endpoint here reports live cluster/node state. Without this the browser is
    // free to answer a repeated GET from its own cache, which showed nodes still sitting
    // in a cluster they had already been reset out of.
    cache: 'no-store',
  };

  if (body !== undefined && body !== null) {
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new MaestroApiError(
      `Network error while calling ${path}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      0,
      'NETWORK_ERROR',
      path,
      error
    );
  }

  if (!response.ok) {
    const details = await parseErrorBody(response);
    throw new MaestroApiError(
      `API request failed: ${response.statusText}`,
      response.status,
      response.statusText,
      path,
      details
    );
  }

  return response as unknown as T;
}

export const apiClient = {
  /**
   * Perform a GET request and parse JSON response.
   */
  async get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    const response = await request<Response>('GET', path, null, options);
    return response.json() as Promise<T>;
  },

  /**
   * Perform a GET request and return blob (for file downloads).
   */
  async getBlob(path: string, options?: ApiRequestOptions): Promise<Blob> {
    const response = await request<Response>('GET', path, null, options);
    return response.blob();
  },

  /**
   * Perform a POST request and parse JSON response.
   */
  async post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await request<Response>('POST', path, body, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    return response.json() as Promise<T>;
  },

  /**
   * Perform a POST request without parsing response (for fire-and-forget).
   */
  async postNoContent(path: string, body?: unknown, options?: ApiRequestOptions): Promise<void> {
    await request<Response>('POST', path, body, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },

  /**
   * Perform a DELETE request.
   * Returns parsed JSON if the server responds with data, or void for 204 No Content.
   */
  async delete<T = void>(path: string, options?: ApiRequestOptions): Promise<T> {
    const response = await request<Response>('DELETE', path, null, options);
    if (response.status === 204) {
      return undefined as unknown as T;
    }
    return response.json() as Promise<T>;
  },
};

