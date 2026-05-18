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
import { useTenantDirectory } from '../../hooks/useTenantDirectory';

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  category: TICKET_CATEGORIES[0],
  requester_name: '',
  requester_email: '',
  department: '',
  device_ids: [],
};

export function CreateTicketModal({ open, onClose, onCreate, loading }) {
  const [form, setForm] = useState(emptyForm);
  const { departmentOptions, usersForDepartment } = useTenantDirectory();
  const departmentUserOptions = usersForDepartment(form.department);

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
  const setRequester = (event) => {
    const email = event.target.value;
    const user = departmentUserOptions.find((item) => item.value === email);
    setForm((f) => ({
      ...f,
      requester_email: email,
      requester_name: user?.full_name || user?.email || '',
      department: user?.department || f.department,
    }));
  };

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Department"
            value={form.department}
            onChange={(event) =>
              setForm((f) => ({
                ...f,
                department: event.target.value,
                requester_email: '',
                requester_name: '',
              }))
            }
            options={[
              { value: '', label: departmentOptions.length ? 'Select department' : 'No departments created' },
              ...departmentOptions,
            ]}
            disabled={loading || departmentOptions.length === 0}
          />
          <Select
            label="Requester"
            value={form.requester_email}
            onChange={setRequester}
            options={[
              {
                value: '',
                label: form.department ? 'Select requester' : 'Select department first',
              },
              ...departmentUserOptions,
            ]}
            disabled={loading || !form.department || departmentUserOptions.length === 0}
          />
        </div>
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
