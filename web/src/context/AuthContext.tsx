import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import type { User } from '../lib/types';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-fetch /api/user/me and update the in-memory user. */
  refresh: () => Promise<User | null>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session via httpOnly cookie
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        if (data?.user) {
          setUser(data.user);
          // cookie holds the token; we don't get it back. We keep token null when using cookies.
        }
      } catch {
        /* not logged in */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    setToken(data.token);
    return data.user as User;
  }, []);

  const signup = useCallback(
    async (fullName: string, email: string, password: string, confirmPassword: string) => {
      const { data } = await api.post('/api/auth/signup', {
        fullName,
        email,
        password,
        confirmPassword,
      });
      setUser(data.user);
      setToken(data.token);
      return data.user as User;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      /* ignore */
    }
    setUser(null);
    setToken(null);
  }, []);

  /**
   * Re-fetch the canonical /me payload. Used after actions that mutate
   * server-side counters (points, dailyStreak, theme, …) so the
   * TopNavbar chips stay in sync without a full page reload.
   */
  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const { data } = await api.get('/api/user/me');
      if (data?.user) {
        setUser(data.user);
        return data.user as User;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}