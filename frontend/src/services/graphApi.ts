import { apiClient } from './apiClient';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  file?: string;
  complexity?: number;
  size?: number;
  district?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type?: string;
}

export interface RepoGraphResponse {
  success: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Retrieves the architectural dependency graph structure of the specified repository.
 */
export async function getRepoGraph(id: string): Promise<RepoGraphResponse> {
  const res = await apiClient.get<RepoGraphResponse>(`/api/repos/${id}/graph`);
  return res.data;
}
