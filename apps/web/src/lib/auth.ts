import type { UserRole } from '@zivara/shared';

const ACCESS_TOKEN_KEY = 'zivara_access_token';
const REFRESH_TOKEN_KEY = 'zivara_refresh_token';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  employerId?: string;
  exp: number;
  iat: number;
}

// Safe localStorage check — works in both server and client contexts
function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isClient()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (!isClient()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Decodes the JWT payload without verifying the signature.
 * Verification is always done server-side by the API.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns the current user decoded from the stored access token.
 * Returns null if not authenticated or token is expired.
 */
export function getCurrentUser(): JwtPayload | null {
  const token = getAccessToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  if (isTokenExpired(payload)) return null;
  return payload;
}

/**
 * Checks if a decoded JWT payload has passed its expiry time.
 * Adds a 10-second buffer to account for clock drift.
 */
export function isTokenExpired(payload: JwtPayload): boolean {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds + 10;
}

/**
 * Checks if the stored access token is expired.
 */
export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  return isTokenExpired(payload);
}
