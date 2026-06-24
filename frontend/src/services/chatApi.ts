import { apiClient } from './apiClient';

export interface Citation {
  file?: string;
  filePath?: string;
  lines?: number[];
  snippet?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id?: string;
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp?: string;
}

export interface SendMessagePayload {
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  citations: Citation[];
}

export interface GetHistoryResponse {
  success: boolean;
  messages: ChatMessage[];
  count: number;
}

export interface DeleteHistoryResponse {
  success: boolean;
  message: string;
}

/**
 * Retrieves the full chat message history associated with a repository.
 */
export async function getChat(repoId: string): Promise<GetHistoryResponse> {
  const res = await apiClient.get<GetHistoryResponse>(`/api/chat/${repoId}`);
  return res.data;
}

/**
 * Sends a chat message query about a repository to the AI orchestrator.
 */
export async function sendChat(
  repoId: string,
  payload: SendMessagePayload
): Promise<SendMessageResponse> {
  const res = await apiClient.post<SendMessageResponse>(`/api/chat/${repoId}`, payload);
  return res.data;
}

/**
 * Clears the chat conversation log associated with a repository.
 */
export async function deleteChat(repoId: string): Promise<DeleteHistoryResponse> {
  const res = await apiClient.delete<DeleteHistoryResponse>(`/api/chat/${repoId}`);
  return res.data;
}
