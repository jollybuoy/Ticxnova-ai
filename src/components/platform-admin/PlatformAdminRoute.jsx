import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAdminGate } from '../../hooks/usePlatformAdminGate';
import PlatformAdminLayout from './PlatformAdminLayout';

function PlatformAdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070c] text-sm text-zinc-400">
      Verifying platform admin access...
    </div>
  );
}

export function PlatformAdminRoute() {
  const { initializing, isAuthenticated, isPlatformAdmin } = usePlatformAdminGate();
  const location = useLocation();

  if (initializing) {
    return <PlatformAdminLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/admin/login" replace state={{ reason: 'not_platform_admin' }} />;
  }

  return <PlatformAdminLayout />;
}

export function PlatformAdminGuestRoute({ children }) {
  const { initializing, isAuthenticated, isPlatformAdmin } = usePlatformAdminGate();

  if (initializing) {
    return <PlatformAdminLoading />;
  }

  if (isAuthenticated && isPlatformAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
