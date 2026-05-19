import { useCallback, useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PlanGate } from '../../components/billing/PlanGate';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { FEATURES } from '../../lib/plans/planConfig';
import { AUDIT_MODULES, listAuditLogs } from '../../lib/audit/auditService';
import { useTenant } from '../../hooks/useTenant';

const MODULE_OPTIONS = [
  { value: 'all', label: 'All modules' },
  { value: AUDIT_MODULES.TICKETS, label: 'Tickets' },
  { value: AUDIT_MODULES.DEVICES, label: 'Devices' },
  { value: AUDIT_MODULES.KB, label: 'Knowledge base' },
  { value: AUDIT_MODULES.USERS, label: 'Users' },
  { value: AUDIT_MODULES.BILLING, label: 'Billing' },
  { value: AUDIT_MODULES.TENANT, label: 'Organization' },
];

export default function AuditLog() {
  const { tenantId } = useTenant();
  const [module, setModule] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await listAuditLogs({
      tenantId,
      module,
      search: debouncedSearch,
      limit: 80,
    });
    if (!error) setLogs(data);
    else setLogs([]);
    setLoading(false);
  }, [debouncedSearch, module, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout>
      <PlanGate feature={FEATURES.AUDIT_LOGS}>
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300/80">
              Compliance
            </p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold tracking-tight text-white">
              <History size={28} className="text-violet-400" />
              Audit log
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Enterprise activity timeline for ticket, device, KB, billing, and admin changes.
            </p>
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search summary, actor, action…"
              className="pl-10"
            />
          </div>
          <Select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            options={MODULE_OPTIONS}
            className="sm:w-48"
          />
        </div>

        <div className="mt-6 glass-card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8 text-violet-400" />
            </div>
          ) : logs.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-zinc-500">No audit events found.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {logs.map((entry) => (
                <li key={entry.id} className="px-6 py-4 hover:bg-white/[0.02]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {entry.summary || `${entry.action} · ${entry.module}`}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {entry.actor_email || 'System'} · {entry.module} · {entry.action}
                        {entry.entity_type ? ` · ${entry.entity_type}` : ''}
                      </p>
                    </div>
                    <time className="text-xs text-zinc-600">
                      {new Date(entry.created_at).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
