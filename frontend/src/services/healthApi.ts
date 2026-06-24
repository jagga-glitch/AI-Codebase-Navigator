import { apiClient } from './apiClient';

export interface HealthStatusResponse {
  success: boolean;
  timestamp: string;
  environment: string;
}

/**
 * Checks the connectivity and running state of the backend server.
 */
export async function getHealth(): Promise<HealthStatusResponse> {
  const res = await apiClient.get<HealthStatusResponse>('/api/health');
  return res.data;
}
