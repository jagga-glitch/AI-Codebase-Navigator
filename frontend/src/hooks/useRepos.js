import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRepo, deleteRepo, getRepos, getRepoById } from '../services/reposApi';

export function useRepos() {
  const query = useQuery({
    queryKey: ['repos'],
    queryFn: getRepos,
    staleTime: 30 * 1000,
  });

  return {
    ...query,
    repos: query.data?.repos || [],
  };
}

export function useRepoDetails(repoId) {
  return useQuery({
    queryKey: ['repos', repoId],
    queryFn: () => getRepoById(repoId),
    enabled: !!repoId,
  });
}

export function useRepoActions() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    },
  });

  return {
    createRepoMutation: createMutation,
    deleteRepoMutation: deleteMutation,
  };
}

