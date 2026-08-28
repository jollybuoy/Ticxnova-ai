import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, PenLine, Ticket } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { RingGauge } from '../ui/RingGauge';
import { UserAvatar } from '../ui/UserAvatar';
import { AiInsightPanel } from '../ai/AiInsightPanel';
import { getFleetBreakdown, healthScore, healthTone, osLabel, systemStatus } from '../../lib/devices/fleetMetrics';

const toneText = {
  green: 'text-emerald-300',
  yellow: 'text-amber-300',
  orange: 'text-orange-300',
  red: 'text-red-300',
};

export function DeviceInspector({ device, devices, alerts, onEdit, onCreateTicket, onReview }) {
  const fleet = getFleetBreakdown(devices);

  if (!device) {
    return (
      <aside className="space-y-4">
        <AiInsightPanel
          title="Fleet intelligence"
          subtitle="Select a device to inspect it"
          gauges={[
            { label: 'Healthy', value: fleet.healthy, max: Math.max(1, fleet.total), color: '#34d399', display: fleet.healthy },
            { label: 'At risk', value: fleet.unmanagedRisk, max: Math.max(1, fleet.total), color: '#fb923c', display: fleet.unmanagedRisk },
            { label: 'Managed', value: fleet.total, max: Math.max(1, fleet.total), color: '#8b5cf6', display: fleet.total },
          ]}
          alerts={alerts}
          cta="Review unhealthy devices"
          onCta={onReview}
        />
      </aside>
    );
  }

  const score = healthScore(device);
  const tone = healthTone(score);

  return (
    <aside className="space-y-4">
      <Card hover={false} className="p-0">
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-violet-300">{device.asset_tag}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{device.name}</h2>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-zinc-400">
                <span className={`h-1.5 w-1.5 rounded-full ${device.health_status === 'Healthy' ? 'bg-emerald-400' : device.health_status === 'Warning' ? 'bg-amber-400' : 'bg-red-500'}`} />
                {device.assigned_user || 'Unassigned'}
                {device.department ? ` · ${device.department}` : ''}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{osLabel(device)}</p>
            </div>
            {device.assigned_user && <UserAvatar name={device.assigned_user} />}
          </div>
        </CardBody>
      </Card>

      <Card hover={false} className="p-0">
        <CardHeader title="Overview" subtitle="Health and system status" />
        <CardBody className="space-y-5">
          <div className="flex justify-center">
            <RingGauge value={score} color={tone.color} label={tone.label} size={120} stroke={10} />
          </div>
          <ul className="space-y-2.5">
            {systemStatus(device).map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{item.label}</span>
                <span className={toneText[item.tone] || 'text-zinc-200'}>{item.value}</span>
              </li>
            ))}
          </ul>
          <div className="grid gap-2">
            <Button variant="secondary" onClick={onCreateTicket}>
              <Ticket size={16} />
              Create ticket
            </Button>
            <Button variant="secondary" onClick={onEdit}>
              <PenLine size={16} />
              Edit device
            </Button>
            <OpenRecordButton id={device.id} />
          </div>
        </CardBody>
      </Card>

      <AiInsightPanel
        title="Active alerts"
        subtitle="Fleet-wide risk"
        alerts={alerts}
        cta="Review recommendations"
        onCta={onReview}
      />
    </aside>
  );
}

function OpenRecordButton({ id }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/devices/${id}`)}
      className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
    >
      View full record
      <ArrowUpRight size={14} />
    </button>
  );
}
