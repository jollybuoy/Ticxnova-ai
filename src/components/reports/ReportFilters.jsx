import { Select } from '../ui/Select';

const rangeOptions = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function optionsFrom(values, fallback) {
  return [{ value: 'all', label: fallback }, ...values.map((value) => ({ value, label: value }))];
}

export function ReportFilters({ filters, onChange, options }) {
  const set = (field) => (event) => onChange({ ...filters, [field]: event.target.value });

  return (
    <div className="glass-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-6">
      <Select label="Date range" value={filters.dateRange} onChange={set('dateRange')} options={rangeOptions} />
      <Select label="Department" value={filters.department} onChange={set('department')} options={optionsFrom(options.departments, 'All departments')} />
      <Select label="Device type" value={filters.deviceType} onChange={set('deviceType')} options={optionsFrom(options.deviceTypes, 'All device types')} />
      <Select label="Priority" value={filters.priority} onChange={set('priority')} options={optionsFrom(options.priorities, 'All priorities')} />
      <Select label="Category" value={filters.category} onChange={set('category')} options={optionsFrom(options.categories, 'All categories')} />
      <Select label="Technician" value={filters.technician} onChange={set('technician')} options={optionsFrom(options.technicians, 'All technicians')} />
    </div>
  );
}
