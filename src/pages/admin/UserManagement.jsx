import { useMemo, useState } from 'react';
import { Copy, Edit3, KeyRound, MailPlus, MoreHorizontal, Shield, Trash2, UploadCloud, Users } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Textarea } from '../../components/ui/Textarea';
import { useTenant } from '../../hooks/useTenant';
import { useTenantUsers } from '../../hooks/useTenantUsers';
import { RBAC_ROLES, canManageUsers } from '../../lib/tenant/tenantService';

const defaultInvite = {
  emails: '',
  role: 'employee',
  department: '',
};

const defaultEditForm = {
  full_name: '',
  role: 'employee',
  department: '',
  is_active: true,
};

function parseUsers(value, defaultDepartment) {
  const seen = new Set();
  return value
    .split(/\n+/)
    .flatMap((line) => {
      const columns = line.split(',').map((part) => part.trim()).filter(Boolean);
      if (columns.length >= 2) {
        return [{
          full_name: columns[0],
          email: columns[1].toLowerCase(),
          department: columns[2] || defaultDepartment || null,
        }];
      }
      return line
        .split(/[\s,;]+/)
        .map((email) => ({ full_name: '', email: email.trim().toLowerCase(), department: defaultDepartment || null }));
    })
    .filter((user) => {
      if (!user.email || seen.has(user.email)) return false;
      seen.add(user.email);
      return true;
    });
}

export default function UserManagement() {
  const {
    users,
    loading,
    mutating,
    currentRole,
    inviteUser,
    adminUpdateUser,
    deleteUser,
    resetPassword,
  } = useTenantUsers();
  const { tenant } = useTenant();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(defaultInvite);
  const [inviteResult, setInviteResult] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetCredential, setResetCredential] = useState(null);
  const canManage = canManageUsers(currentRole);

  const activeCount = useMemo(() => users.filter((user) => user.is_active).length, [users]);
  const parsedUsers = useMemo(
    () => parseUsers(inviteForm.emails, inviteForm.department),
    [inviteForm.department, inviteForm.emails],
  );
  const createdCredentials = inviteResult?.invited ?? [];

  const handleInvite = async (event) => {
    event.preventDefault();
    const result = await inviteUser({ ...inviteForm, users: parsedUsers });
    if (result.success) {
      setInviteResult(result.data);
      if ((result.data?.rejected ?? []).length === 0 && (result.data?.invited ?? []).length === 0) {
        setInviteForm(defaultInvite);
        setInviteOpen(false);
      }
    }
  };

  const handleInviteFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setInviteForm((current) => ({
      ...current,
      emails: [current.emails, text].filter(Boolean).join('\n'),
    }));
    event.target.value = '';
  };

  const copyCredentials = async () => {
    const text = createdCredentials
      .map((user) => `${user.email}, ${user.temporary_password}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    toast.success('Temporary credentials copied');
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      full_name: user.full_name ?? '',
      department: user.department ?? '',
      is_active: Boolean(user.is_active),
    });
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    const result = await adminUpdateUser(editingUser.id, {
      role: editForm.role,
      full_name: editForm.full_name || null,
      department: editForm.department || null,
      is_active: editForm.is_active,
    });
    if (result.success) setEditingUser(null);
  };

  const handleDelete = async () => {
    const result = await deleteUser(deleteTarget.id);
    if (result.success) setDeleteTarget(null);
  };

  const handleResetPassword = async (user) => {
    const result = await resetPassword(user.id);
    if (result.success) {
      setResetCredential({
        email: user.email,
        temporary_password: result.data.temporary_password,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
            Identity & Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">User Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Create tenant users, generate temporary passwords, assign roles, and deactivate access.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} disabled={!canManage}>
          <MailPlus size={17} />
          Create Users
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <Users className="h-6 w-6 text-violet-300" />
          <p className="mt-4 text-2xl font-semibold text-white">{users.length}</p>
          <p className="text-sm text-zinc-400">Total tenant users</p>
        </div>
        <div className="glass-card p-5">
          <Shield className="h-6 w-6 text-emerald-300" />
          <p className="mt-4 text-2xl font-semibold text-white">{activeCount}</p>
          <p className="text-sm text-zinc-400">Active users</p>
        </div>
        <div className="glass-card p-5">
          <MoreHorizontal className="h-6 w-6 text-cyan-300" />
          <p className="mt-4 text-2xl font-semibold text-white">{users.length - activeCount}</p>
          <p className="text-sm text-zinc-400">Inactive users</p>
        </div>
      </div>

      <section className="glass-card overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Tenant Directory</h2>
        </div>
        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Spinner className="h-6 w-6 text-violet-300" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/[0.06]">
              <thead className="bg-white/[0.03]">
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Department</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {users.map((user) => (
                  <tr key={user.id} className="text-sm text-zinc-300">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{user.email}</p>
                      <p className="text-xs text-zinc-500">
                        {user.full_name || (user.joined_at ? 'Joined workspace' : 'Provisioned user')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="capitalize text-zinc-200">{user.role.replaceAll('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-4">
                      {user.department || <span className="text-zinc-600">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.is_active
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          disabled={!canManage || mutating}
                          onClick={() => openEdit(user)}
                        >
                          <Edit3 size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={!canManage || mutating || !user.user_id}
                          onClick={() => handleResetPassword(user)}
                        >
                          <KeyRound size={14} />
                          Reset
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                          disabled={!canManage || mutating}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteResult(null);
        }}
        title="Create users"
        description={`Paste emails or upload a CSV. Users must use ${tenant?.domain || 'your organization domain'} and public domains like Gmail or Outlook are blocked.`}
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Textarea
            label="Email Addresses"
            value={inviteForm.emails}
            onChange={(event) => {
              setInviteResult(null);
              setInviteForm((current) => ({ ...current, emails: event.target.value }));
            }}
            placeholder="Alex Morgan, alex@company.com, IT Operations&#10;Priya Shah, priya@company.com, Security"
            rows={7}
            required
          />
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
            <div className="flex items-center justify-between gap-3">
              <span>
                {parsedUsers.length} unique user{parsedUsers.length === 1 ? '' : 's'} ready
              </span>
              <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-white/[0.06]">
                <UploadCloud size={15} />
                Upload CSV
                <input
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={handleInviteFile}
                />
              </label>
            </div>
            <p className="text-xs text-zinc-500">
              Enter one email per line, or CSV rows: Full Name, Email, Department. Users must change the password after first login.
            </p>
          </div>
          <Select
            label="Role"
            value={inviteForm.role}
            options={RBAC_ROLES.filter((role) => role.value !== 'super_admin').map((role) => ({
              value: role.value,
              label: role.label,
            }))}
            onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
          />
          <Input
            label="Default Department"
            value={inviteForm.department}
            onChange={(event) => setInviteForm((current) => ({ ...current, department: event.target.value }))}
          />
          {inviteResult?.rejected?.length > 0 && (
            <div className="max-h-44 overflow-y-auto rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm">
              <p className="font-medium text-red-200">
                {inviteResult.rejected.length} rejected user
                {inviteResult.rejected.length === 1 ? '' : 's'}
              </p>
              <div className="mt-3 space-y-2">
                {inviteResult.rejected.map((item) => (
                  <div key={`${item.email}-${item.reason}`} className="text-xs text-red-100/80">
                    <span className="font-medium">{item.email}</span> - {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
          {createdCredentials.length > 0 && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-emerald-100">
                    {createdCredentials.length} user{createdCredentials.length === 1 ? '' : 's'} created
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/70">
                    Copy these temporary passwords now. They are shown only once.
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={copyCredentials}>
                  <Copy size={15} />
                  Copy
                </Button>
              </div>
              <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                {createdCredentials.map((user) => (
                  <div
                    key={user.email}
                    className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-zinc-200"
                  >
                    <div className="font-medium text-white">{user.email}</div>
                    <div className="mt-1 font-mono text-emerald-200">{user.temporary_password}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" loading={mutating}>
            Create {parsedUsers.length > 1 ? `${parsedUsers.length} Users` : 'User'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Edit user account"
        description={editingUser?.email}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.full_name}
            onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))}
          />
          <Select
            label="Role"
            value={editForm.role}
            options={RBAC_ROLES.filter((role) => role.value !== 'super_admin').map((role) => ({
              value: role.value,
              label: role.label,
            }))}
            onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value }))}
          />
          <Input
            label="Department"
            value={editForm.department}
            onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
          />
          <Select
            label="Account Status"
            value={editForm.is_active ? 'active' : 'inactive'}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, is_active: event.target.value === 'active' }))
            }
          />
          <Button type="submit" className="w-full" loading={mutating}>
            Save User Details
          </Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete user account?"
        description="This removes the tenant membership and deletes the Supabase Auth account."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            This action cannot be undone. The user will no longer be able to sign in.
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            User: <span className="font-semibold text-white">{deleteTarget?.email}</span>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="border-red-400/20 bg-gradient-to-r from-red-600 to-rose-600 shadow-red-600/20 hover:shadow-red-600/30"
              loading={mutating}
              onClick={handleDelete}
            >
              Confirm Delete User
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(resetCredential)}
        onClose={() => setResetCredential(null)}
        title="Temporary password generated"
        description="Share this with the user. They must change it after signing in."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100/90">
            <div className="font-medium">{resetCredential?.email}</div>
            <div className="mt-2 font-mono text-lg text-white">{resetCredential?.temporary_password}</div>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${resetCredential.email}, ${resetCredential.temporary_password}`,
              );
              toast.success('Temporary password copied');
            }}
          >
            <Copy size={15} />
            Copy Temporary Password
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
