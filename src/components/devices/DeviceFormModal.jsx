import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { DEVICE_STATUSES, DEVICE_TYPES } from '../../lib/devices/constants';

const emptyForm = {
  asset_tag: '',
  name: '',
  device_type: 'Laptop',
  serial_number: '',
  assigned_user: '',
  department: '',
  location: '',
  manufacturer: '',
  model: '',
  purchase_date: '',
  warranty_expiry: '',
  health_status: 'Healthy',
  notes: '',
  service_request_id: '',
};

export function DeviceFormModal({
  open,
  onClose,
  device,
  onSubmit,
  loading,
  serviceRequestOptions = [],
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (device) setForm({ ...emptyForm, ...device });
    else setForm(emptyForm);
  }, [device, open]);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!device && !form.service_request_id) return;
    const result = await onSubmit(form);
    if (result.success) onClose();
  };

  const requiresServiceRequest = !device;
  const canSubmit =
    !loading && (!requiresServiceRequest || Boolean(form.service_request_id));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={device ? 'Edit device' : 'Add device'}
      description="Manage endpoint and asset inventory details."
      size="xl"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Device name" value={form.name} onChange={set('name')} required disabled={loading} />
          <Input label="Asset tag" value={form.asset_tag ?? ''} onChange={set('asset_tag')} placeholder="Auto-generated if empty" disabled={loading} />
          {!device && (
            <Select
              label="Attach service request (required)"
              value={form.service_request_id}
              onChange={set('service_request_id')}
              options={[
                {
                  value: '',
                  label:
                    serviceRequestOptions.length === 0
                      ? 'No service requests available'
                      : 'Select service request',
                },
                ...serviceRequestOptions,
              ]}
              disabled={loading || serviceRequestOptions.length === 0}
              required
              className="sm:col-span-2"
            />
          )}
          <Select label="Device type" value={form.device_type} onChange={set('device_type')} options={DEVICE_TYPES} disabled={loading} />
          <Select label="Health status" value={form.health_status} onChange={set('health_status')} options={DEVICE_STATUSES} disabled={loading} />
          <Input label="Serial number" value={form.serial_number ?? ''} onChange={set('serial_number')} disabled={loading} />
          <Input label="Assigned user" value={form.assigned_user ?? ''} onChange={set('assigned_user')} disabled={loading} />
          <Input label="Department" value={form.department ?? ''} onChange={set('department')} disabled={loading} />
          <Input label="Location" value={form.location ?? ''} onChange={set('location')} disabled={loading} />
          <Input label="Manufacturer" value={form.manufacturer ?? ''} onChange={set('manufacturer')} disabled={loading} />
          <Input label="Model" value={form.model ?? ''} onChange={set('model')} disabled={loading} />
          <Input label="Purchase date" type="date" value={form.purchase_date ?? ''} onChange={set('purchase_date')} disabled={loading} />
          <Input label="Warranty expiry" type="date" value={form.warranty_expiry ?? ''} onChange={set('warranty_expiry')} disabled={loading} />
        </div>
        <Textarea label="Device notes" value={form.notes ?? ''} onChange={set('notes')} disabled={loading} />
        {!device && (
          <p className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-xs leading-relaxed text-violet-100/80">
            A service request is required before adding a device. Create a ticket with category
            Device Request if no service request is available.
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!canSubmit}>
            {device ? 'Save changes' : 'Add device'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
