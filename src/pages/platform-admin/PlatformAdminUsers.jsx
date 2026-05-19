import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Power, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  fetchPlatformUsers,
  formatPlatformError,
  setPlatformUserStatus,
} from '../../lib/platform-admin/platformAdminService';

export default function PlatformAdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchPlatformUsers(search);
    if (error) {
      toast.error(formatPlatformError(error));
      setUsers([]);
    } else {
      setUsers(data?.users ?? []);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleUser = async (entry) => {
    setBusyId(entry.id);
    const nextActive = entry.is_disabled;
    const { error } = await setPlatformUserStatus(entry.id, nextActive);
    setBusyId(null);
    if (error) {
      toast.error(formatPlatformError(error));
      return;
    }
    toast.success(nextActive ? 'User enabled.' : 'User disabled.');
    await load();
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Users</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Global user directory</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Cross-workspace accounts with tenure, last sign-in, and disable controls.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1">
          <Input
            label="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Email, name, domain, workspace"
          />
        </div>
        <Button type="button" variant="secondary" onClick={load} disabled={loading}>
          <Search size={16} />
          Refresh
        </Button>
      </div>

      {loading && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">Loading users...</div>}

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            <tr>
              <th className="px-4 py-4">User</th>
              <th className="px-4 py-4">Workspace</th>
              <th className="px-4 py-4">Role</th>
              <th className="px-4 py-4">Member for</th>
              <th className="px-4 py-4">Last sign-in</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((entry) => (
              <tr key={entry.id} className="border-t border-white/5 text-zinc-300">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{entry.full_name || '—'}</p>
                  <p className="text-xs text-zinc-500">{entry.email}</p>
                </td>
                <td className="px-4 py-4">
                  <p>{entry.workspace_name || '—'}</p>
                  <p className="text-xs text-zinc-500">{entry.workspace_domain || 'No domain'}</p>
                </td>
                <td className="px-4 py-4 capitalize">{entry.role?.replaceAll('_', ' ')}</td>
                <td className="px-4 py-4">{entry.days_since_signup} days</td>
                <td className="px-4 py-4">
                  {entry.last_sign_in_at
                    ? `${entry.days_since_last_login ?? 0}d ago`
                    : 'Never'}
                </td>
                <td className="px-4 py-4">
                  {entry.is_disabled ? (
                    <span className="text-red-300">Disabled</span>
                  ) : (
                    <span className="text-emerald-300">Active</span>
                  )}
                  {!entry.workspace_active && (
                    <p className="mt-1 text-xs text-amber-300">Workspace disabled</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busyId === entry.id}
                    onClick={() => toggleUser(entry)}
                  >
                    <Power size={16} />
                    {entry.is_disabled ? 'Enable' : 'Disable'}
                  </Button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  No users match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
