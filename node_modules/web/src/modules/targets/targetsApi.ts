import { api } from '../../lib/api';
import type {
  CreateTargetInput,
  Target,
  UpdateTargetInput,
} from '../../lib/types';

/** Thin Axios wrapper around the `/api/targets` endpoints. */

export const targetsApi = {
  list: () =>
    api.get<{ targets: Target[] }>('/api/targets').then((r) => r.data.targets),

  get: (id: string) =>
    api.get<{ target: Target }>(`/api/targets/${id}`).then((r) => r.data.target),

  create: (data: CreateTargetInput) =>
    api.post<{ target: Target }>('/api/targets', data).then((r) => r.data.target),

  update: (id: string, data: UpdateTargetInput) =>
    api
      .patch<{ target: Target }>(`/api/targets/${id}`, data)
      .then((r) => r.data.target),

  remove: (id: string) =>
    api.delete<{ ok: true }>(`/api/targets/${id}`).then((r) => r.data),
};

export type { CreateTargetInput, UpdateTargetInput };