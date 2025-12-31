import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ user: User; token: string }>;
  register: (name: string, email: string, username: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const login = async (username: string, password: string) => {
    const authResponse = await authService.login(username, password);
    authService.setAuth(authResponse);
    setUser(authResponse.user);
    return authResponse;
  };

  const register = async (name: string, email: string, username: string, password: string) => {
    const authResponse = await authService.register(name, email, username, password);
    authService.setAuth(authResponse);
    setUser(authResponse.user);
    return authResponse;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

