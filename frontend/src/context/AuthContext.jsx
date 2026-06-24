import { createContext, useContext, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth.js';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const value = useMemo(() => {
    return {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading || isBootstrapping,
      error: auth.error,
      register: async (payload) => {
        const res = await auth.register(payload);
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        return res;
      },
      login: async (payload) => {
        const res = await auth.login(payload);
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        return res;
      },
      logout: () => {
        localStorage.removeItem('token');
        queryClient.clear();
      },
      meQuery: auth.meQuery,
    };
  }, [auth, isBootstrapping, queryClient]);

  if (auth.meQuery.isFetched && isBootstrapping) {
    setIsBootstrapping(false);
  }

  if (auth.meQuery.isError && isBootstrapping) {
    // If unauthenticated or token invalid, allow app to proceed as logged out
    setIsBootstrapping(false);
  }


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

