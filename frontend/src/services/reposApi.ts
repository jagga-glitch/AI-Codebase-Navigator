import { apiClient } from './apiClient';

export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
}

export interface RepoStats {
  fileCount?: number;
  totalFiles?: number;
  languages?: LanguageStat[];
  frameworks?: string[];
  dependencies?: string[];
  devDependencies?: string[];
  hasTests?: boolean;
  hasDocumentation?: boolean;
  avgFileComplexity?: number;
}

export interface HealthScore {
  overall: number;
  maintainability: number;
  documentation: number;
  testCoverage: number;
  dependencyHealth: number;
}

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

export interface RepoGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RepoInsight {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file?: string;
}

export interface Repository {
  id: string;
  _id: string;
  userId: string;
  githubUrl: string;
  name?: string;
  owner?: string;
  description?: string;
  defaultBranch: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  errorMessage?: string;
  stats?: RepoStats;
  healthScore?: HealthScore;
  graph?: RepoGraph;
  insights?: RepoInsight[];
  summary?: string;
  knowledgeGap?: any;
  createdAt: string;
  analyzedAt?: string;
}

export interface RepoCreatePayload {
  githubUrl: string;
}

export interface ImpactPayload {
  feature: string;
}

export interface GetReposResponse {
  success: boolean;
  count: number;
  repos: Repository[];
}

export interface DeleteRepoResponse {
  success: boolean;
  message: string;
}

export interface RepoGraphResponse {
  success: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ImpactResponse {
  success: boolean;
  impact: string;
}

export interface KnowledgeGapResponse {
  success: boolean;
  knowledgeGap: any;
}

export interface FileContentResponse {
  success: boolean;
  content: string;
}

/**
 * Gets all repositories for the logged-in user.
 */
export async function getRepos(): Promise<GetReposResponse> {
  const res = await apiClient.get<GetReposResponse>('/api/repos');
  return res.data;
}

/**
 * Submits a new repository for indexing.
 */
export async function createRepo(payload: RepoCreatePayload): Promise<Repository> {
  const res = await apiClient.post<Repository>('/api/repos', payload);
  return res.data;
}

/**
 * Gets a single repository by its database ID.
 */
export async function getRepoById(id: string): Promise<Repository> {
  const res = await apiClient.get<Repository>(`/api/repos/${id}`);
  return res.data;
}

/**
 * Deletes a repository and its associated chat logs.
 */
export async function deleteRepo(id: string): Promise<DeleteRepoResponse> {
  const res = await apiClient.delete<DeleteRepoResponse>(`/api/repos/${id}`);
  return res.data;
}

/**
 * Gets the dependency graph structure of the repository.
 */
export async function getRepoGraph(id: string): Promise<RepoGraphResponse> {
  const res = await apiClient.get<RepoGraphResponse>(`/api/repos/${id}/graph`);
  return res.data;
}

/**
 * Triggers feature impact analysis for a hypothetical feature description.
 */
export async function postRepoImpact(id: string, payload: ImpactPayload): Promise<ImpactResponse> {
  const res = await apiClient.post<ImpactResponse>(`/api/repos/${id}/impact`, payload);
  return res.data;
}

/**
 * Fetches the generated learning roadmap/knowledge gap analysis for the repository.
 */
export async function getKnowledgeGap(id: string): Promise<KnowledgeGapResponse> {
  const res = await apiClient.get<KnowledgeGapResponse>(`/api/repos/${id}/knowledge-gap`);
  return res.data;
}

/**
 * Retrieves the raw content of a specific file in the repository from GitHub.
 */
export async function getRepoFile(id: string, filePath: string): Promise<FileContentResponse> {
  const res = await apiClient.get<FileContentResponse>(`/api/repos/${id}/file`, {
    params: { path: filePath }
  });
  return res.data;
}
