import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';

/**
 * ThemeContext — light/dark mode with Tailwind's `dark` class strategy.
 *
 *  - Initial preference: localStorage → system prefers-color-scheme.
 *  - Applies the `dark` class on <html> so Tailwind's `dark:` variants work.
 *  - Persists to localStorage synchronously so a reload keeps the choice.
 *  - On mount, if the authenticated user has a stored theme on the server,
 *    it is reconciled into local state.
 *  - On every change we PATCH /api/user/me (best-effort, no await) so the
 *    choice survives across devices.
 */

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggle: () => void;
};

const STORAGE_KEY = 'pc:theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function detectInitial(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function applyToDom(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({
  children,
  serverTheme,
}: {
  children: ReactNode;
  serverTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(detectInitial);

  // Apply the class on mount + whenever the state flips.
  useEffect(() => {
    applyToDom(theme);
  }, [theme]);

  // If the authenticated user already has a theme saved on the server and
  // it's different from the locally-derived one, prefer the server value.
  useEffect(() => {
    if (!serverTheme) return;
    if (serverTheme === theme) return;
    setThemeState(serverTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, serverTheme);
    } catch {
      /* ignore */
    }
    // We only want to react to a *change* in serverTheme, not to local updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage may be unavailable in private mode */
    }
    // Best-effort server sync. We swallow errors — the UI choice is already
    // committed locally; a failed PATCH is logged for the next session.
    api
      .patch('/api/user/me', { theme: next })
      .catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return ctx;
}
