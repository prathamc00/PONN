import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, setToken, clearAuth, getStoredUser, setStoredUser, getToken } from '../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  college?: string;
  branch?: string;
  semester?: number;
  phone?: string;
  approvalStatus?: string;
  enrolledCourses?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(false);

  // Sync user from /auth/me on mount if token exists but user is stale
  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      apiFetch('/auth/me')
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setStoredUser(data.user);
          } else {
            clearAuth();
            setUser(null);
            setTokenState(null);
          }
        })
        .catch(() => {
          clearAuth();
          setUser(null);
          setTokenState(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!data.success) throw new Error(data.message || 'Login failed');

      setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      setStoredUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (formData: any): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!data.success) throw new Error(data.message || 'Registration failed');

      setToken(data.token);
      setTokenState(data.token);
      setUser(data.user);
      setStoredUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setTokenState(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
