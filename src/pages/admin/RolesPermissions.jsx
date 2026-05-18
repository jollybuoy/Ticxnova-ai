import { useMemo, useState } from 'react';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useTenant } from '../../hooks/useTenant';
import { useTenantUsers } from '../../hooks/useTenantUsers';
import {
  canManageUsers,
  createCustomRole,
  getTenantErrorMessage,
} from '../../lib/tenant/tenantService';

const permissionTemplates = [
  { key: 'tickets', label: 'Tickets', values: ['none', 'read', 'create', 'manage'] },
  { key: 'devices', label: 'Devices', values: ['none', 'read', 'manage'] },
  { key: 'users', label: 'Users', values: ['none', 'read', 'manage'] },
  { key: 'reports', label: 'Reports', values: ['none', 'read', 'manage'] },
  { key: 'settings', label: 'Settings', values: ['none', 'read', 'manage'] },
];

const defaultRole = {
  name: '',
  description: '',
  permissions: {
    tickets: 'read',
    devices: 'read',
    users: 'none',
    reports: 'read',
    settings: 'none',
  },
};

export default function RolesPermissions() {
  const { tenantId, role } = useTenant();
  const { roles, loading, refetch } = useTenantUsers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultRole);
  const [saving, setSaving] = useState(false);
  const canManage = canManageUsers(role);

  const systemRoles = useMemo(() => roles.filter((item) => item.is_system), [roles]);
  const customRoles = useMemo(() => roles.filter((item) => !item.is_system), [roles]);

  const updatePermission = (key, value) => {
    setForm((current) => ({
      ...current,
      permissions: { ...current.permissions, [key]: value },
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    const { error } = await createCustomRole(tenantId, form);
    setSaving(false);
    if (error) {
      toast.error(getTenantErrorMessage(error));
      return;
    }
    toast.success('Custom role created');
    setForm(defaultRole);
    setOpen(false);
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
            RBAC Controls
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Roles & Permissions</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Define role boundaries for tenant data, operations, reporting, and administration.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!canManage}>
          <KeyRound size={17} />
          Create Custom Role
        </Button>
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
                <p className="text-sm text-zinc-400">Enterprise defaults used by RLS policies.</p>
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
              <p className="mt-1 text-sm text-zinc-400">System and custom role permission scopes.</p>
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
                  {[...systemRoles, ...customRoles].map((item) => (
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create custom role"
        description="Custom roles are tenant scoped and can be expanded into granular UI controls."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Role Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {permissionTemplates.map((permission) => (
              <label key={permission.key} className="space-y-2">
                <span className="text-xs font-medium text-zinc-400">{permission.label}</span>
                <select
                  value={form.permissions[permission.key]}
                  onChange={(event) => updatePermission(permission.key, event.target.value)}
                  className="focus-ring w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white"
                >
                  {permission.values.map((value) => (
                    <option key={value} value={value} className="bg-zinc-900">
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Create Role
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
