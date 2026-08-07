import { api } from '../../lib/api';
import type { DashboardData, ProgressData } from '../../lib/types';

/**
 * Thin wrappers around the dashboard endpoints. Keep this file dumb —
 * no retry logic, no transforms. All aggregation lives in the backend.
 */
export const dashboardApi = {
  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get('/api/dashboard');
    return data as DashboardData;
  },

  async getProgress(): Promise<ProgressData> {
    const { data } = await api.get('/api/dashboard/progress');
    return data as ProgressData;
  },
};