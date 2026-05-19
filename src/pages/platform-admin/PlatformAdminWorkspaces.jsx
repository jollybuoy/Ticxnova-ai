import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, Power, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  deletePlatformWorkspace,
  fetchPlatformWorkspaces,
  formatPlatformError,
  setWorkspaceStatus,
} from '../../lib/platform-admin/platformAdminService';

export default function PlatformAdminWorkspaces() {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await fetchPlatformWorkspaces();
    if (error) {
      toast.error(formatPlatformError(error));
      setWorkspaces([]);
    } else {
      setWorkspaces(data?.workspaces ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleWorkspace = async (workspace) => {
    setBusyId(workspace.id);
    const nextActive = !workspace.is_active;
    const { error } = await setWorkspaceStatus(workspace.id, nextActive);
    setBusyId(null);
    if (error) {
      toast.error(formatPlatformError(error));
      return;
    }
    toast.success(nextActive ? 'Workspace enabled.' : 'Workspace disabled.');
    await load();
  };

  const removeWorkspace = async (workspace) => {
    if (!window.confirm(`Delete workspace "${workspace.company_name}" and all member auth accounts?`)) {
      return;
    }
    setBusyId(workspace.id);
    const { error } = await deletePlatformWorkspace(workspace.id);
    setBusyId(null);
    if (error) {
      toast.error(formatPlatformError(error));
      return;
    }
    toast.success('Workspace deleted and domain released.');
    await load();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">Workspaces</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Domains & organizations</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Every row is a tenant workspace with admin accounts, age, and enable/disable controls.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </header>

      {loading && <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">Loading workspaces...</div>}

      <div className="space-y-4">
        {workspaces.map((workspace) => {
          const expanded = expandedId === workspace.id;
          return (
            <article
              key={workspace.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{workspace.company_name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {workspace.domain} · {workspace.subscription_plan} · {workspace.days_since_created} days old
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Created {new Date(workspace.created_at).toLocaleString()} · {workspace.user_count} users (
                      {workspace.active_user_count} active)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      workspace.is_active ? 'bg-emerald-500/15 text-emerald-200' : 'bg-red-500/15 text-red-200'
                    }`}
                  >
                    {workspace.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busyId === workspace.id}
                    onClick={() => toggleWorkspace(workspace)}
                  >
                    <Power size={16} />
                    {workspace.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busyId === workspace.id}
                    onClick={() => setExpandedId(expanded ? null : workspace.id)}
                  >
                    {expanded ? 'Hide admins' : 'View admins'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busyId === workspace.id}
                    onClick={() => removeWorkspace(workspace)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </Button>
                </div>
              </div>

              {expanded && (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-white/5">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      <tr>
                        <th className="px-4 py-3">Admin</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Account age</th>
                        <th className="px-4 py-3">Last sign-in</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(workspace.admin_accounts ?? []).map((admin) => (
                        <tr key={admin.id} className="border-t border-white/5 text-zinc-300">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{admin.full_name || '—'}</p>
                            <p className="text-xs text-zinc-500">{admin.email}</p>
                          </td>
                          <td className="px-4 py-3 capitalize">{admin.role?.replaceAll('_', ' ')}</td>
                          <td className="px-4 py-3">{admin.days_since_created} days</td>
                          <td className="px-4 py-3">
                            {admin.last_sign_in_at
                              ? new Date(admin.last_sign_in_at).toLocaleString()
                              : 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            {admin.is_disabled ? (
                              <span className="text-red-300">Disabled</span>
                            ) : (
                              <span className="text-emerald-300">Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!workspace.admin_accounts?.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                            No org admin accounts linked to this workspace.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
        {!loading && workspaces.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
            No workspaces found.
          </div>
        )}
      </div>
    </div>
  );
}
