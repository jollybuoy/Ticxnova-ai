import { Grid3X3, ListFilter, Plus, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { DEVICE_STATUSES, DEVICE_TYPES } from '../../lib/devices/constants';

export function DevicesToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  type,
  onTypeChange,
  view,
  onViewChange,
  onCreate,
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
          <Input
            label="Search inventory"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search device, asset tag, serial, user..."
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            options={[{ value: 'all', label: 'All statuses' }, ...DEVICE_STATUSES]}
          />
          <Select
            label="Type"
            value={type}
            onChange={(event) => onTypeChange(event.target.value)}
            options={[{ value: 'all', label: 'All types' }, ...DEVICE_TYPES]}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'table' ? 'primary' : 'secondary'}
            onClick={() => onViewChange('table')}
            className="px-3"
          >
            <ListFilter size={16} />
            Table
          </Button>
          <Button
            variant={view === 'grid' ? 'primary' : 'secondary'}
            onClick={() => onViewChange('grid')}
            className="px-3"
          >
            <Grid3X3 size={16} />
            Grid
          </Button>
          <Button onClick={onCreate}>
            <Plus size={16} />
            Add device
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
        <Search size={14} />
        Realtime inventory with assigned users, department mapping, health and warranty visibility.
      </div>
    </div>
  );
}
