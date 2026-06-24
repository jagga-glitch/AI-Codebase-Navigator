import { apiClient } from './apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  [key: string]: any;
}

export interface LoginPayload {
  email: string;
  password?: string;
  [key: string]: any;
}

/**
 * Registers a new user and stores the JWT token on success.
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  if (res.data.success && res.data.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
}

/**
 * Logs in a user and stores the JWT token on success.
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  if (res.data.success && res.data.token) {
    localStorage.setItem('token', res.data.token);
  }
  return res.data;
}

/**
 * Fetches the authenticated user profile.
 */
export async function getMe(): Promise<AuthResponse> {
  const res = await apiClient.get<AuthResponse>('/api/auth/me');
  return res.data;
}

/**
 * Clears local user authentication token.
 */
export function logout(): void {
  localStorage.removeItem('token');
}
