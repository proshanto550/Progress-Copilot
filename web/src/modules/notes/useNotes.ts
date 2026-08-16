import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from './notesApi';

export function useNotes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notes'],
    queryFn: notesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: notesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; content: string } }) =>
      notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notes: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createNote: createMutation.mutateAsync,
    updateNote: updateMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    saving: createMutation.isPending || updateMutation.isPending,
  };
}
