import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from './coursesApi';

export function useCourses() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string; resourceLink: string; semester: string } }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: coursesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return {
    courses: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    createCourse: createMutation.mutateAsync,
    updateCourse: updateMutation.mutateAsync,
    deleteCourse: deleteMutation.mutateAsync,
    saving: createMutation.isPending || updateMutation.isPending,
  };
}
