import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function DeleteTicketModal({ open, onClose, ticket, onConfirm, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete ticket"
      description={
        ticket
          ? `Permanently delete ${ticket.ticket_number}? This action cannot be undone.`
          : undefined
      }
      size="sm"
    >
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          className="!bg-red-600 !from-red-600 !to-red-700 hover:!shadow-red-600/30"
          loading={loading}
          disabled={loading}
          onClick={onConfirm}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
