import { useMemo, useState } from 'react';
import { MailPlus, MoreHorizontal, Shield, UploadCloud, Users } from 'lucide-react';
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

function parseEmails(value) {
  return [
    ...new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export default function UserManagement() {
  const { users, loading, mutating, currentRole, inviteUser, updateUser } = useTenantUsers();
  const { tenant } = useTenant();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(defaultInvite);
  const [inviteResult, setInviteResult] = useState(null);
  const canManage = canManageUsers(currentRole);

  const activeCount = useMemo(() => users.filter((user) => user.is_active).length, [users]);
  const parsedEmails = useMemo(() => parseEmails(inviteForm.emails), [inviteForm.emails]);

  const handleInvite = async (event) => {
    event.preventDefault();
    const result = await inviteUser({ ...inviteForm, emails: parsedEmails });
    if (result.success) {
      setInviteResult(result.data);
      if ((result.data?.rejected ?? []).length === 0) {
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
            Identity & Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">User Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Invite users, assign tenant roles, map departments, and deactivate access.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} disabled={!canManage}>
          <MailPlus size={17} />
          Invite User
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
                        {user.joined_at ? 'Joined workspace' : 'Invitation pending'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Select
                        value={user.role}
                        disabled={!canManage || mutating}
                        options={RBAC_ROLES.map((role) => ({ value: role.value, label: role.label }))}
                        onChange={(event) => updateUser(user.id, { role: event.target.value })}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <Input
                        defaultValue={user.department ?? ''}
                        disabled={!canManage || mutating}
                        placeholder="Department"
                        onBlur={(event) => updateUser(user.id, { department: event.target.value || null })}
                      />
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
                      <Button
                        variant="secondary"
                        disabled={!canManage || mutating}
                        onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
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
        title="Invite users"
        description={`Paste emails or upload a CSV. Invitees must use ${tenant?.domain || 'your organization domain'} and public domains like Gmail or Outlook are blocked.`}
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Textarea
            label="Email Addresses"
            value={inviteForm.emails}
            onChange={(event) => {
              setInviteResult(null);
              setInviteForm((current) => ({ ...current, emails: event.target.value }));
            }}
            placeholder="alex@company.com&#10;sam@company.com, priya@company.com"
            rows={7}
            required
          />
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
            <div className="flex items-center justify-between gap-3">
              <span>
                {parsedEmails.length} unique email{parsedEmails.length === 1 ? '' : 's'} ready
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
              Accepted separators: comma, semicolon, space, or new line. Maximum 250 emails per batch.
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
            label="Department"
            value={inviteForm.department}
            onChange={(event) => setInviteForm((current) => ({ ...current, department: event.target.value }))}
          />
          {inviteResult?.rejected?.length > 0 && (
            <div className="max-h-44 overflow-y-auto rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm">
              <p className="font-medium text-red-200">
                {inviteResult.rejected.length} rejected invitation
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
          <Button type="submit" className="w-full" loading={mutating}>
            Send {parsedEmails.length > 1 ? `${parsedEmails.length} Invites` : 'Invite'}
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
