import { describe, expect, it } from 'vitest';
import {
  isOwnRequest,
  isRequesterAllowedPath,
  isRequesterRole,
  requesterHomePath,
} from './requesterAccess';

describe('requester portal access', () => {
  it('treats employees as requesters and keeps technicians on the staff app', () => {
    expect(isRequesterRole('employee')).toBe(true);
    expect(isRequesterRole('technician')).toBe(false);
    expect(isRequesterRole('org_admin')).toBe(false);
  });

  it('allows only self-service routes for requesters', () => {
    expect(isRequesterAllowedPath('/portal')).toBe(true);
    expect(isRequesterAllowedPath('/tickets/abc')).toBe(true);
    expect(isRequesterAllowedPath('/knowledge-base')).toBe(true);
    expect(isRequesterAllowedPath('/dashboard')).toBe(false);
    expect(isRequesterAllowedPath('/ai-assistant')).toBe(false);
    expect(requesterHomePath()).toBe('/portal');
  });

  it('matches own requests by user id or requester email', () => {
    const user = { id: 'u1', email: 'ada@acme.com' };
    expect(isOwnRequest({ user_id: 'u1' }, user)).toBe(true);
    expect(isOwnRequest({ requester_email: 'ada@acme.com' }, user)).toBe(true);
    expect(isOwnRequest({ user_id: 'other', requester_email: 'sam@acme.com' }, user)).toBe(false);
  });
});
