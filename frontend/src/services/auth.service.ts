import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(
    name: string,
    email: string,
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      name,
      email,
      username,
      password,
    });
    return response.data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      username,
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

