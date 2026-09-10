import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FullScreenSpinner } from '@/components/ui';
import { useBootstrapAuth, useIsAuthenticated } from '@/features/auth/hooks';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const booted = useBootstrapAuth();
  const authed = useIsAuthenticated();
  const location = useLocation();
  if (!booted) return <FullScreenSpinner label="Загружаем…" />;
  if (!authed) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
