import { Navigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext.jsx';

export function ProtectedRoutes({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

