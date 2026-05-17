import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  getTicketTypeForCategory,
} from '../../lib/tickets/constants';
import { DeviceSelector, suggestTicketCategory } from '../itsm/DeviceSelector';

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  category: TICKET_CATEGORIES[0],
  requester_name: '',
  department: '',
  device_ids: [],
};

export function CreateTicketModal({ open, onClose, onCreate, loading }) {
  const [form, setForm] = useState(emptyForm);

  const handleClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onCreate({
      ...form,
      ticket_type: getTicketTypeForCategory(form.category),
    });
    if (result.success) {
      setForm(emptyForm);
      onClose();
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleDeviceSelection = (deviceIds) => {
    setForm((f) => ({ ...f, device_ids: deviceIds }));
  };

  const handlePrimaryDeviceChange = (device) => {
    setForm((f) => ({
      ...f,
      department: device.department || f.department,
      category: suggestTicketCategory(device) || f.category,
    }));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create ticket"
      description="Submit a new support request to your IT queue."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          placeholder="Brief summary of the issue"
          value={form.title}
          onChange={set('title')}
          required
          disabled={loading}
        />
        <Textarea
          label="Description"
          placeholder="Steps to reproduce, error messages, etc."
          value={form.description}
          onChange={set('description')}
          disabled={loading}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            value={form.priority}
            onChange={set('priority')}
            options={TICKET_PRIORITIES}
            disabled={loading}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={set('category')}
            options={TICKET_CATEGORIES.map((c) => ({ value: c, label: c }))}
            disabled={loading}
          />
        </div>
        <Input
          label="Requester name"
          placeholder="Who reported this issue?"
          value={form.requester_name}
          onChange={set('requester_name')}
          disabled={loading}
        />
        <Input
          label="Department"
          placeholder="Auto-filled from selected device when available"
          value={form.department}
          onChange={set('department')}
          disabled={loading}
        />
        <DeviceSelector
          selectedIds={form.device_ids}
          onChange={handleDeviceSelection}
          onPrimaryDeviceChange={handlePrimaryDeviceChange}
          disabled={loading}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            Create ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
