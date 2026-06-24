import { useQuery } from '@tanstack/react-query';
import { getMe, login, register } from '../services/authApi';

export function useAuth() {
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    retry: false,
    staleTime: 60 * 1000,
  });

  return {
    meQuery,
    user: meQuery.data?.user || null,
    isAuthenticated: !!meQuery.data?.user,
    isLoading: meQuery.isLoading,
    error: meQuery.error || null,
    register: register,
    login: login,
  };
}

