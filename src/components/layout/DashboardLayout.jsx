import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { BackgroundMesh } from './BackgroundMesh';
import { TrialBanner } from '../billing/TrialBanner';
import { ReadOnlyBanner } from '../billing/ReadOnlyBanner';

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen">
      <BackgroundMesh variant="dashboard" />
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          collapsed={collapsed}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            onMenuClick={() => setSidebarOpen(true)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
          <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1600px] space-y-8">
              <ReadOnlyBanner />
              <TrialBanner />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
