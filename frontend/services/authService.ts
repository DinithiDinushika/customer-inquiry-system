import { apiClient, getStoredToken, setStoredToken, removeStoredToken } from './apiClient';
import { User, LoginResponse, MeResponse } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });

    if (response.token) {
      setStoredToken(response.token);
    }

    return response;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient<MeResponse>('/auth/me', {
      method: 'GET',
      requiresAuth: true,
    });
    return response.user;
  },

  logout: (): void => {
    removeStoredToken();
  },

  getToken: (): string | null => {
    return getStoredToken();
  },

  isAuthenticated: (): boolean => {
    return !!getStoredToken();
  },
};
