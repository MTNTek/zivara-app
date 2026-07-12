import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAccessTokenExpired,
} from './auth';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 * On success, stores the new token pair and returns the new access token.
 * On failure, clears all tokens (forces re-login).
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as TokenPair;
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

/**
 * Core fetch wrapper that:
 * 1. Attaches the Bearer access token
 * 2. Proactively refreshes if the token is expired before sending
 * 3. On 401, attempts a silent refresh and retries the request once
 * 4. Throws ApiError on non-2xx responses
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Proactively refresh if token is expired before making the request
  if (isAccessTokenExpired()) {
    await refreshAccessToken();
  }

  const makeRequest = async (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  let accessToken = getAccessToken();
  let response = await makeRequest(accessToken);

  // On 401, attempt a silent refresh and retry once
  if (response.status === 401) {
    accessToken = await refreshAccessToken();
    if (accessToken) {
      response = await makeRequest(accessToken);
    }
  }

  // If still 401 after refresh attempt, the session is invalid — redirect to login
  if (response.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized', 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = (await response.json()) as ApiErrorResponse;
    } catch {
      throw new ApiError(response.status, 'UnknownError', response.statusText);
    }
    throw new ApiError(
      errorData.statusCode,
      errorData.error,
      errorData.message,
      errorData.requestId,
    );
  }

  // 204 No Content — return empty object cast to T
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
