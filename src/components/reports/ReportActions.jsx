import { Download, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

export function ReportActions({ onCsv, onPdf }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={onCsv}>
        <Download size={16} />
        Export CSV
      </Button>
      <Button variant="secondary" onClick={onPdf}>
        <FileText size={16} />
        Export PDF
      </Button>
    </div>
  );
}
