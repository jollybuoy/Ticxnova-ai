import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Shield, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  approvePlatformVerification,
  deletePlatformWorkspace,
  fetchPlatformVerifications,
  formatPlatformError,
  rejectPlatformVerification,
} from '../../lib/platform-admin/platformAdminService';

function WorkspaceCard({ workspace, onApprove, onReject, onDelete, busyId }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{workspace.company_name}</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {workspace.domain} · {workspace.verification_status} · {workspace.days_since_created}d
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Admins: {workspace.admin_emails?.join(', ') || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            loading={busyId === workspace.id}
            onClick={() => onApprove(workspace.id)}
          >
            <CheckCircle2 size={16} />
            Approve
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={busyId === workspace.id}
            onClick={() => onReject(workspace.id)}
          >
            <XCircle size={16} />
            Reject
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={busyId === workspace.id}
            onClick={() => onDelete(workspace)}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function PlatformAdminVerifications() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: payload, error } = await fetchPlatformVerifications();
    if (error) {
      toast.error(formatPlatformError(error));
      setData(null);
    } else {
      setData(payload);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (tenantId) => {
    setBusyId(tenantId);
    const { error } = await approvePlatformVerification(tenantId);
    setBusyId(null);
    if (error) {
      toast.error(formatPlatformError(error));
      return;
    }
    toast.success('Workspace approved and domain verified.');
    await load();
  };

  const reject = async (tenantId) => {
    const reason = window.prompt('Rejection reason for the organization admin:');
    if (!reason?.trim()) return;
    setBusyId(tenantId);
    const { error } = await rejectPlatformVerification(tenantId, reason.trim());
    setBusyId(null);
    if (error) {
      toast.error(formatPlatformError(error));
      return;
    }
    toast.success('Workspace rejected.');
    await load();
  };

  const remove = async (workspace) => {
    if (!window.confirm(`Delete workspace "${workspace.company_name}"?`)) return;
    setBusyId(workspace.id);
    const { error } = await deletePlatformWorkspace(workspace.id);
    setBusyId(null);
    if (error) {
      toast.error(formatPlatformError(error));
      return;
    }
    toast.success('Workspace deleted.');
    await load();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/80">
            Verification control
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Domain approvals</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Review pending workspaces, duplicate domain attempts, and activation requests.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </header>

      {loading && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
          Loading verification queue...
        </div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Shield size={18} className="text-amber-300" />
              <h3 className="text-lg font-semibold text-white">
                Pending verification ({data.pending?.length ?? 0})
              </h3>
            </div>
            <div className="space-y-3">
              {(data.pending ?? []).map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  busyId={busyId}
                  onApprove={approve}
                  onReject={reject}
                  onDelete={remove}
                />
              ))}
              {!data.pending?.length && (
                <p className="text-sm text-zinc-500">No pending verification requests.</p>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-300" />
              <h3 className="text-lg font-semibold text-white">Duplicate domain alerts</h3>
            </div>
            <div className="space-y-4">
              {(data.duplicate_domains ?? []).map((group) => (
                <article
                  key={group.domain}
                  className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-4"
                >
                  <p className="font-medium text-orange-100">
                    {group.domain} · {group.count} workspaces
                  </p>
                  <div className="mt-3 space-y-2">
                    {group.workspaces.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={{
                          ...workspace,
                          days_since_created: 0,
                          admin_emails: workspace.admin_emails,
                        }}
                        busyId={busyId}
                        onApprove={approve}
                        onReject={reject}
                        onDelete={remove}
                      />
                    ))}
                  </div>
                </article>
              ))}
              {!data.duplicate_domains?.length && (
                <p className="text-sm text-zinc-500">No duplicate domain conflicts.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
