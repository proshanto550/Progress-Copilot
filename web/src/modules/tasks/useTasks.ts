import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from './tasksApi';
import { getErrorMessage } from '../../lib/api';
import type {
  CreateTaskInput,
  Task,
  ToggleTaskResult,
  UpdateTaskInput,
} from '../../lib/types';

/**
 * useTasks — list/create/update/toggle/delete tasks for the current user.
 *
 * `toggle()` returns the rich server response (pointsDelta + streakBumped)
 * so callers can show a toast or refresh the auth context to reflect the
 * updated `points` / `dailyStreak`.
 */
export function useTasks(filter?: { targetId?: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = filter?.targetId
        ? await tasksApi.listByTarget(filter.targetId)
        : await tasksApi.list();
      setTasks(list);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load tasks'));
    } finally {
      setLoading(false);
    }
  }, [filter?.targetId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(async (data: CreateTaskInput) => {
    const t = await tasksApi.create(data);
    setTasks((prev) => [t, ...prev]);
    return t;
  }, []);

  const update = useCallback(async (id: string, data: UpdateTaskInput) => {
    const t = await tasksApi.update(id, data);
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...t } : x)));
    return t;
  }, []);

  const toggle = useCallback(
    async (id: string, isCompleted: boolean): Promise<ToggleTaskResult> => {
      const result = await tasksApi.toggle(id, isCompleted);
      setTasks((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, isCompleted: result.task.isCompleted, completedAt: result.task.completedAt }
            : x,
        ),
      );
      return result;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await tasksApi.remove(id);
    setTasks((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { tasks, loading, error, reload, create, update, toggle, remove };
}