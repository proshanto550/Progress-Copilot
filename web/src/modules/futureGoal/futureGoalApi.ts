import { api } from '../../lib/api';
import type { FutureGoal } from '../../lib/types';

/** Thin Axios wrapper around the `/api/future-goal` singleton endpoint. */

export const futureGoalApi = {
  get: () =>
    api
      .get<{ goal: FutureGoal | null }>('/api/future-goal/me')
      .then((r) => r.data.goal),

  upsert: (title: string) =>
    api
      .put<{ goal: FutureGoal }>('/api/future-goal/me', { title })
      .then((r) => r.data.goal),
};