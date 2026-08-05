import { api } from './api';

export type Theme = 'light' | 'dark';

/**
 * Shape of the user object returned by GET /api/user/me.
 * Keep in sync with `safe` in api/src/modules/user/user.controller.ts
 * and the `select` projection in `api/src/middlewares/auth.ts`.
 */
export type Me = {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  theme: Theme;
  points: number;
  dailyStreak: number;
  createdAt: string;
};

/**
 * Fetch the authenticated user's layout data.
 * Used by Sidebar (avatar/fullName/email), TopNavbar (streak/points) and
 * ProfileDropdown. The backend also exposes this at /api/auth/me — we
 * prefer /api/user/me so the frontend doesn't depend on auth internals.
 */
export async function fetchMe(): Promise<Me> {
  const { data } = await api.get<{ user: Me }>('/api/user/me');
  return data.user;
}

export async function updateMeTheme(theme: Theme): Promise<Me> {
  const { data } = await api.patch<{ user: Me }>('/api/user/me', { theme });
  return data.user;
}
