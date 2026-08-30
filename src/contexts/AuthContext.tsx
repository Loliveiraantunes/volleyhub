import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../services/api';
import type { LoginRequest } from '../types/api';

interface JwtPayload {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

interface AuthContextValue {
  isAuthenticated: boolean;
  adminEmail: string | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 > Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
    });
  }, []);

  useEffect(() => {
    if (token && !isTokenValid(token)) {
      logout();
    }
  }, [token, logout]);

  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      setToken(response.token);
      setTokenState(response.token);
    } finally {
      setLoading(false);
    }
  }, []);

  const adminEmail = useMemo(() => {
    if (!token) return null;
    const payload = decodeJwt(token);
    return payload?.sub ?? payload?.email ?? null;
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: isTokenValid(token),
      adminEmail,
      loading,
      login,
      logout,
    }),
    [token, adminEmail, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
