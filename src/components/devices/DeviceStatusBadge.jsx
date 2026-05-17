import { Badge } from '../ui/Badge';
import { getDeviceStatusMeta } from '../../lib/devices/constants';

export function DeviceStatusBadge({ status }) {
  const meta = getDeviceStatusMeta(status);
  return <Badge variant={meta.badge}>{meta.label}</Badge>;
}
