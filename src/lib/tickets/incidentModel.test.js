import { describe, expect, it } from 'vitest';
import {
  canEscalate,
  encodeCommentBody,
  formatRemaining,
  getCommentBody,
  getCommentVisibility,
  getStepIndex,
  getTicketSla,
  nextPriority,
} from './incidentModel';

describe('incidentModel', () => {
  it('maps ticket status onto the incident stepper', () => {
    expect(getStepIndex('open')).toBe(0);
    expect(getStepIndex('in_progress')).toBe(1);
    expect(getStepIndex('resolved')).toBe(3);
  });

  it('escalates until P1 and then stops', () => {
    expect(nextPriority('medium')).toBe('high');
    expect(nextPriority('urgent')).toBe('urgent');
    expect(canEscalate('urgent')).toBe(false);
  });

  it('treats urgent tickets older than 4 hours as breached', () => {
    const sla = getTicketSla(
      { status: 'open', priority: 'urgent', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      Date.now(),
    );
    expect(sla.breached).toBe(true);
    expect(sla.label).toBe('Breached');
    expect(formatRemaining(0)).toBe('0 MIN');
  });

  it('encodes requester replies so they stay distinct from internal notes', () => {
    const encoded = encodeCommentBody('Service restored', 'public');
    const parsed = { body: encoded };
    expect(getCommentVisibility(parsed)).toBe('public');
    expect(getCommentBody(parsed)).toBe('Service restored');
  });
});
