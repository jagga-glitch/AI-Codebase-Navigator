import axios from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.toString();
  }
  const defaultPort = '5055'; // Fallback backend port matching server/.env
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${defaultPort}/api`;
  }
  return `http://localhost:${defaultPort}/api`;
};

export const apiClient = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to format errors and handle token expiration/invalidation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
    }

    const apiError: ApiError = {
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Request failed',
      status: error?.response?.status,
      data: error?.response?.data,
    };

    return Promise.reject(apiError);
  }
);
