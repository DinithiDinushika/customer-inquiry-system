import { ApiError } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'coffee_ninja_auth_token';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export const apiClient = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const { requiresAuth = true, headers = {}, ...restOptions } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        code: data?.error?.code || 'REQUEST_FAILED',
        message: data?.error?.message || response.statusText || 'An unexpected error occurred.',
        details: data?.error?.details || data?.error?.fields || null,
      };

      // Handle unauthenticated response
      if (response.status === 401 && requiresAuth) {
        removeStoredToken();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?session_expired=true';
        }
      }

      throw error;
    }

    return data as T;
  } catch (error: any) {
    if (error?.status) {
      throw error;
    }
    // Network or connection errors
    throw {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to server. Please verify the backend is running.',
      details: error.message,
    } as ApiError;
  }
};
