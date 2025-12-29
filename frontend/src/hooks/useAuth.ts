import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const token = authService.getStoredToken();

    if (storedUser && token) {
      setUser(storedUser);
      // Verify token is still valid
      authService.getProfile()
        .then((user) => setUser(user))
        .catch(() => {
          authService.logout();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const authResponse = await authService.login(email, password);
    authService.setAuth(authResponse);
    setUser(authResponse.user);
    return authResponse;
  };

  const register = async (email: string, password: string, name: string) => {
    const authResponse = await authService.register(email, password, name);
    authService.setAuth(authResponse);
    setUser(authResponse.user);
    return authResponse;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};

