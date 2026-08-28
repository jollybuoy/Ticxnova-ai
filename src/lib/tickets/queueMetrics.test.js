import { describe, expect, it } from 'vitest';
import { formatSlaClock, getSlaRiskTickets, greetingForHour, weekPriorityBars } from './queueMetrics';

describe('queueMetrics', () => {
  it('greets by time of day', () => {
    expect(greetingForHour(8)).toBe('Good morning');
    expect(greetingForHour(15)).toBe('Good afternoon');
    expect(greetingForHour(21)).toBe('Good evening');
  });

  it('flags urgent tickets older than the SLA window as risk', () => {
    const tickets = [
      {
        status: 'open',
        priority: 'urgent',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];
    expect(getSlaRiskTickets(tickets)).toHaveLength(1);
    expect(formatSlaClock(tickets[0]).tone).toBe('red');
  });

  it('builds a 7-day priority stack', () => {
    const bars = weekPriorityBars([
      { created_at: new Date().toISOString(), priority: 'urgent' },
      { created_at: new Date().toISOString(), priority: 'medium' },
    ]);
    expect(bars).toHaveLength(7);
    expect(bars.at(-1).critical + bars.at(-1).normal).toBeGreaterThanOrEqual(2);
  });
});
