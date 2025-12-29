import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<{ user: User }>('/api/auth/profile');
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  },

  setAuth(authResponse: AuthResponse) {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  },
};

