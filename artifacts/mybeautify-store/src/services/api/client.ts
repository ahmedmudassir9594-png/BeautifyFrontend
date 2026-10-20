/**
 * Core HTTP Request Client for Spring Boot API backend
 * Context path: /api (proxied via Vite server to http://localhost:8080/api)
 */

import { STORAGE_KEYS } from '@/constants';

const DEFAULT_API_BASE_URL = 'https://1h14g3nx-8080.inc1.devtunnels.ms/api';

export function getApiBaseUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL);
  const base = envUrl || DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const baseUrl = getApiBaseUrl();
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If baseUrl already ends with /api and path starts with /api/, strip the duplicate /api
  if (baseUrl.endsWith('/api') && (path === '/api' || path.startsWith('/api/'))) {
    path = path.slice(4) || '/';
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setAuthToken(token: string | null, remember = false): void {
  if (token) {
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export function setRefreshToken(refreshToken: string | null, remember = false): void {
  if (refreshToken) {
    sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (remember) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}

// In-flight refresh promise to prevent duplicate refresh requests
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  const currentRefresh = getRefreshToken();
  if (!currentRefresh) return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const url = buildApiUrl('/auth/refresh-token');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      });

      if (!res.ok) {
        setAuthToken(null);
        return null;
      }

      const resData = await res.json().catch(() => null);
      const data = (resData && typeof resData === 'object' && 'data' in resData) ? resData.data : resData;
      const newAccessToken = data?.accessToken || data?.token;
      const newRefreshToken = data?.refreshToken;

      if (newAccessToken) {
        const remember = Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN));
        setAuthToken(newAccessToken, remember);
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken, remember);
        }
        return newAccessToken;
      }

      setAuthToken(null);
      return null;
    } catch {
      setAuthToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = buildApiUrl(endpoint);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    const errorMsg = netErr?.message || 'Network error: could not connect to backend at ' + getApiBaseUrl();
    throw new Error(errorMsg);
  }

  // Handle expired/unauthorized session with automatic refresh
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register') || endpoint.includes('/auth/refresh-token');
  if ((res.status === 401 || res.status === 403) && token && !isAuthEndpoint) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      // Retry original request with newly refreshed token
      headers.set('Authorization', `Bearer ${newToken}`);
      try {
        res = await fetch(url, {
          ...options,
          headers,
        });
      } catch (retryErr: any) {
        throw new Error(retryErr?.message || 'Network error on retried request');
      }
    } else {
      setAuthToken(null);
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.message || data?.error || (typeof data === 'string' ? data : null) || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  // Handle explicit failure flags in 200 responses
  if (data && typeof data === 'object' && 'success' in data && data.success === false) {
    throw new Error(data.message || 'Operation failed');
  }

  // Handle wrapped Spring Boot ApiResponse { success: true, message: "...", data: ... }
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}
