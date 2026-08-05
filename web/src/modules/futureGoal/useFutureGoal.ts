import { useCallback, useEffect, useState } from 'react';
import { futureGoalApi } from './futureGoalApi';
import { getErrorMessage } from '../../lib/api';
import type { FutureGoal } from '../../lib/types';

/**
 * useFutureGoal — load + upsert the user's singleton Future Goal.
 *
 * `title` is the only field on the model today; the hook is shaped to
 * accept a `string` save() so the page can wire a single input to it.
 */
export function useFutureGoal() {
  const [goal, setGoal] = useState<FutureGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const g = await futureGoalApi.get();
      setGoal(g);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load future goal'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (title: string) => {
    const g = await futureGoalApi.upsert(title);
    setGoal(g);
    return g;
  }, []);

  return { goal, loading, error, reload, save };
}