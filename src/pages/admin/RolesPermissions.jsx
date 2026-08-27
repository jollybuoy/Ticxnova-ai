import { useMemo } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useTenantUsers } from '../../hooks/useTenantUsers';

const permissionTemplates = [
  { key: 'tickets', label: 'Tickets' },
  { key: 'devices', label: 'Devices' },
  { key: 'users', label: 'Users' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

export default function RolesPermissions() {
  const { roles, loading } = useTenantUsers();

  const uniqueRoles = useMemo(
    () => [...new Map(roles.map((item) => [`${item.tenant_id ?? 'system'}:${item.name}`, item])).values()],
    [roles],
  );
  const systemRoles = useMemo(() => uniqueRoles.filter((item) => item.is_system), [uniqueRoles]);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
            RBAC Controls
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Roles & Permissions</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Access is enforced with five system roles. Custom roles are not applied to routes or RLS.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card flex min-h-[360px] items-center justify-center">
          <Spinner className="h-6 w-6 text-violet-300" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="glass-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-200">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">System Roles</h2>
                <p className="text-sm text-zinc-400">Defaults used by route guards and RLS policies.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {systemRoles.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold capitalize text-white">{item.name.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-sm text-zinc-400">{item.description}</p>
                    </div>
                    <LockKeyhole className="h-4 w-4 text-zinc-500" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card overflow-hidden">
            <div className="border-b border-white/[0.06] px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Permission Matrix</h2>
              <p className="mt-1 text-sm text-zinc-400">What each system role can do today.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/[0.06]">
                <thead className="bg-white/[0.03]">
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <th className="px-5 py-4 font-medium">Role</th>
                    {permissionTemplates.map((permission) => (
                      <th key={permission.key} className="px-5 py-4 font-medium">
                        {permission.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {systemRoles.map((item) => (
                    <tr key={item.id} className="text-sm text-zinc-300">
                      <td className="px-5 py-4 font-medium capitalize text-white">
                        {item.name.replaceAll('_', ' ')}
                      </td>
                      {permissionTemplates.map((permission) => (
                        <td key={permission.key} className="px-5 py-4">
                          <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">
                            {item.permissions?.all ? 'all' : item.permissions?.[permission.key] ?? 'none'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
