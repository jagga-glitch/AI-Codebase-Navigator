import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getRepoGraph,
  getKnowledgeGap,
  getRepoFile,
  postRepoImpact,
  getRepoById,
} from '../services/reposApi';

export function useRepoGraph(repoId) {
  return useQuery({
    queryKey: ['repos', repoId, 'graph'],
    queryFn: () => getRepoGraph(repoId),
    enabled: !!repoId,
  });
}

export function useKnowledgeGap(repoId) {
  return useQuery({
    queryKey: ['repos', repoId, 'knowledge-gap'],
    queryFn: () => getKnowledgeGap(repoId),
    enabled: !!repoId,
  });
}

export function useRepoFile(repoId, filePath) {
  return useQuery({
    queryKey: ['repos', repoId, 'file', filePath],
    queryFn: () => getRepoFile(repoId, filePath),
    enabled: !!repoId && !!filePath,
  });
}

export function useRepoImpact(repoId) {
  return useMutation({
    mutationFn: (payload) => postRepoImpact(repoId, payload),
  });
}

export { getRepoById };

