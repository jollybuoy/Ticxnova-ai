import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export function AppShellLayout() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}
