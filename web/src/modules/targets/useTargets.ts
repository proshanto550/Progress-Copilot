import { useCallback, useEffect, useState } from 'react';
import { targetsApi } from './targetsApi';
import { getErrorMessage } from '../../lib/api';
import type {
  CreateTargetInput,
  Target,
  UpdateTargetInput,
} from '../../lib/types';

/**
 * useTargets — list/create/update/delete targets for the current user.
 *
 * Returns a memoised API plus a `reload()` so pages can refresh after
 * creating a target from a modal. Errors surface via the `error` field
 * rather than thrown exceptions so pages can render an inline banner.
 */
export function useTargets() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await targetsApi.list();
      setTargets(list);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load targets'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(async (data: CreateTargetInput) => {
    const t = await targetsApi.create(data);
    setTargets((prev) => [t, ...prev]);
    return t;
  }, []);

  const update = useCallback(async (id: string, data: UpdateTargetInput) => {
    const t = await targetsApi.update(id, data);
    setTargets((prev) => prev.map((x) => (x.id === id ? { ...x, ...t } : x)));
    return t;
  }, []);

  const remove = useCallback(async (id: string) => {
    await targetsApi.remove(id);
    setTargets((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { targets, loading, error, reload, create, update, remove };
}