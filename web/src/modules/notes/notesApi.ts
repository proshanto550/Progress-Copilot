import { api } from '../../lib/api';

export type Note = {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export const notesApi = {
  getAll: () => api.get<{ notes: Note[] }>('/api/notes').then((r) => r.data.notes),
  create: (data: { title: string; content: string }) =>
    api.post<{ note: Note }>('/api/notes', data).then((r) => r.data.note),
  update: (id: string, data: { title: string; content: string }) =>
    api.put<{ note: Note }>(`/api/notes/${id}`, data).then((r) => r.data.note),
  delete: (id: string) => api.delete<{ ok: boolean }>(`/api/notes/${id}`).then((r) => r.data),
};
