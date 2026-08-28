import { describe, expect, it } from 'vitest';
import { getFleetBreakdown, healthScore, lifecycleLabel, osLabel } from './fleetMetrics';

describe('fleetMetrics', () => {
  it('scores healthy assigned devices higher than critical ones', () => {
    expect(healthScore({ health_status: 'Healthy', assigned_user: 'Ava' })).toBeGreaterThan(
      healthScore({ health_status: 'Critical', assigned_user: 'Ava' }),
    );
  });

  it('treats unassigned hardware as in stock', () => {
    expect(lifecycleLabel({ assigned_user: '' })).toBe('In stock');
    expect(lifecycleLabel({ assigned_user: 'Jamie' })).toBe('In use');
  });

  it('maps Apple laptops to macOS', () => {
    expect(osLabel({ manufacturer: 'Apple', device_type: 'Laptop' })).toBe('macOS');
  });

  it('counts fleet buckets from live inventory', () => {
    const fleet = getFleetBreakdown([
      { health_status: 'Healthy', assigned_user: 'A' },
      { health_status: 'Warning' },
      { health_status: 'Critical', assigned_user: 'B' },
      { health_status: 'Offline' },
    ]);
    expect(fleet).toMatchObject({ total: 4, healthy: 1, attention: 1, critical: 1, offline: 1, assigned: 2, inStock: 2 });
  });
});
