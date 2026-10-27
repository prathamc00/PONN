import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, setToken, clearAuth, getStoredUser, setStoredUser, getToken } from '../utils/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setTokenState] = useState(() => getToken());
  const [isLoading, setIsLoading] = useState(false);

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

  const login = useCallback(async (email, password) => {
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

  const register = useCallback(async (formData) => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (!data.success) throw new Error(data.message || 'Registration failed');
      if (data.token) {
        setToken(data.token);
        setTokenState(data.token);
        setUser(data.user);
        setStoredUser(data.user);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setTokenState(null);
    const base = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
    window.location.href = `${base}/login`;
  }, []);

  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      setStoredUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
