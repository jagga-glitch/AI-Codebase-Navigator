import axios from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

const getBaseURL = (): string => {
  let baseUrl = '';
  
  if (import.meta.env.VITE_API_BASE_URL) {
    baseUrl = import.meta.env.VITE_API_BASE_URL.toString();
  } else {
    const defaultPort = '5055'; // Fallback backend port matching server/.env
    if (typeof window !== 'undefined') {
      baseUrl = `${window.location.protocol}//${window.location.hostname}:${defaultPort}`;
    } else {
      baseUrl = `http://localhost:${defaultPort}`;
    }
  }

  // Ensure the baseUrl does not end with '/api' or '/api/' because all apiClient requests 
  // explicitly start with '/api' (e.g. '/api/auth/login').
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  } else if (baseUrl.endsWith('/api/')) {
    baseUrl = baseUrl.slice(0, -5);
  }

  // Strip trailing slash if present to maintain consistency
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  return baseUrl;
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

    const requestUrl = error?.config
      ? `${error.config.baseURL || ''}${error.config.url || ''}`
      : 'unknown';

    const apiError: ApiError = {
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        `${error?.message || 'Request failed'} (URL: ${requestUrl})`,
      status: error?.response?.status,
      data: error?.response?.data,
    };

    return Promise.reject(apiError);
  }
);
