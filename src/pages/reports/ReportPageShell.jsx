import { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ReportFilters } from '../../components/reports/ReportFilters';
import { ReportActions } from '../../components/reports/ReportActions';
import { useAnalytics } from '../../hooks/useAnalytics';
import { defaultReportFilters } from '../../lib/reports/filterDefaults';
import { exportRowsToCsv, exportRowsToPdf } from '../../lib/reports/analyticsService';

export function ReportPageShell({ eyebrow, title, description, csvName, exportRows, children }) {
  const [filters, setFilters] = useState(defaultReportFilters);
  const { analytics, data, filterOptions, loading } = useAnalytics(filters);
  const rows = () => exportRows(data, analytics);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-label">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">{description}</p>
        </div>
        <ReportActions
          onCsv={() => exportRowsToCsv(csvName, rows())}
          onPdf={() => exportRowsToPdf(title, rows())}
        />
      </div>

      <ReportFilters filters={filters} onChange={setFilters} options={filterOptions} />

      {loading ? (
        <div className="glass-card px-6 py-12 text-center text-sm text-zinc-500">Loading analytics...</div>
      ) : (
        children({ analytics, data, filters })
      )}
    </DashboardLayout>
  );
}
