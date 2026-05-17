import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <motion.div className="flex min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </motion.div>
  );
}
