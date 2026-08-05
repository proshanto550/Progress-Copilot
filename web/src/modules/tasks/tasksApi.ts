import { api } from '../../lib/api';
import type {
  CreateTaskInput,
  Task,
  ToggleTaskResult,
  UpdateTaskInput,
} from '../../lib/types';

/** Thin Axios wrapper around the `/api/tasks` endpoints. */

export const tasksApi = {
  list: (targetId?: string) =>
    api
      .get<{ tasks: Task[] }>('/api/tasks', {
        params: targetId ? { targetId } : undefined,
      })
      .then((r) => r.data.tasks),

  listByTarget: (targetId: string) =>
    api
      .get<{ tasks: Task[] }>(`/api/tasks/by-target/${targetId}`)
      .then((r) => r.data.tasks),

  get: (id: string) =>
    api.get<{ task: Task }>(`/api/tasks/${id}`).then((r) => r.data.task),

  create: (data: CreateTaskInput) =>
    api.post<{ task: Task }>('/api/tasks', data).then((r) => r.data.task),

  update: (id: string, data: UpdateTaskInput) =>
    api.patch<{ task: Task }>(`/api/tasks/${id}`, data).then((r) => r.data.task),

  toggle: (id: string, isCompleted: boolean) =>
    api
      .patch<ToggleTaskResult>(`/api/tasks/${id}/toggle`, { isCompleted })
      .then((r) => r.data),

  remove: (id: string) =>
    api.delete<{ ok: true }>(`/api/tasks/${id}`).then((r) => r.data),
};

export type { CreateTaskInput, UpdateTaskInput };