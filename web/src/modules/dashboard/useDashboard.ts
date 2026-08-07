import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from './dashboardApi';
import { getErrorMessage } from '../../lib/api';
import type { DashboardData, ProgressData } from '../../lib/types';

/**
 * useDashboard — wraps GET /api/dashboard with the same initial-loading
 * + silent-reload convention used by useTasks/useTargets so optimistic
 * UI updates (e.g. ticking a task checkbox on the dashboard) don't
 * unmount the cards.
 */
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const fresh = await dashboardApi.getDashboard();
      setData(fresh);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

/**
 * useProgress — wraps GET /api/dashboard/progress (My Progress page).
 */
export function useProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const fresh = await dashboardApi.getProgress();
      setData(fresh);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load progress'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}