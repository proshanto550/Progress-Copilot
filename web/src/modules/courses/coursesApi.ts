import { api } from '../../lib/api';

export type Course = {
  id: string;
  userId: string;
  semester: string;
  title: string;
  resourceLink: string;
  createdAt: string;
  updatedAt: string;
};

export const coursesApi = {
  getAll: () => api.get<{ courses: Course[] }>('/api/courses').then((r) => r.data.courses),
  create: (data: { title: string; resourceLink: string; semester: string }) =>
    api.post<{ course: Course }>('/api/courses', data).then((r) => r.data.course),
  update: (id: string, data: { title: string; resourceLink: string; semester: string }) =>
    api.put<{ course: Course }>(`/api/courses/${id}`, data).then((r) => r.data.course),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/courses/${id}`).then((r) => r.data),
};
