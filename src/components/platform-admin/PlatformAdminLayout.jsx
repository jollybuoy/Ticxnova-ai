import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const navItems = [
  { to: '/admin/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/admin/verifications', label: 'Domain Approvals', icon: Shield },
  { to: '/admin/workspaces', label: 'Workspaces & Domains', icon: Building2 },
  { to: '/admin/users', label: 'All Users', icon: Users },
  { to: '/admin/profile', label: 'Admin Profile', icon: UserCog },
];

export default function PlatformAdminLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07070c] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.08),transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-amber-400/10 bg-black/40 p-6 backdrop-blur-xl lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-amber-500/20">
              <Shield size={22} className="text-black" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Internal</p>
              <h1 className="text-lg font-semibold text-white">Ticxnova Super Admin</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/20'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Signed in</p>
            <p className="mt-2 truncate text-sm font-medium text-white">{user?.email}</p>
            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={handleSignOut}>
              <LogOut size={16} />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 lg:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Super Admin</p>
              <h1 className="text-xl font-semibold text-white">Ticxnova Platform</h1>
            </div>
            <Button type="button" variant="secondary" onClick={handleSignOut}>
              Sign out
            </Button>
          </header>

          <nav className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium ${
                    isActive ? 'bg-amber-400/20 text-amber-100' : 'bg-white/5 text-zinc-400'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
