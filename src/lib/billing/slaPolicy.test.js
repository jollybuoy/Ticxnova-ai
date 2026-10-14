import { describe, expect, it } from 'vitest';
import { DEFAULT_SLA_HOURS, normalizeSlaHours } from './slaPolicy';

describe('SLA policy', () => {
  it('keeps current 4/8/24/48 hour windows when nothing is configured', () => {
    expect(normalizeSlaHours(null)).toEqual(DEFAULT_SLA_HOURS);
  });

  it('accepts custom hours without dropping other priorities', () => {
    expect(normalizeSlaHours({ urgent: 2, medium: 12 })).toEqual({
      urgent: 2,
      high: 8,
      medium: 12,
      low: 48,
    });
  });
});
