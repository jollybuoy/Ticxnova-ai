import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageTransition } from '../components/layout/PageTransition';

export function ProtectedAppLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
