import { describe, expect, it } from 'vitest';
import {
  isMailReady,
  normalizeMailConfig,
  ticketMailRecipients,
} from './mailConfig';

describe('organization mail relay', () => {
  it('fills Microsoft 365 SMTP defaults when nothing is saved', () => {
    expect(normalizeMailConfig(null)).toMatchObject({
      provider: 'microsoft365',
      smtp_host: 'smtp.office365.com',
      smtp_port: 587,
    });
  });

  it('is ready only when From and a secret exist', () => {
    const config = { from_email: 'it@acme.com', provider: 'resend' };
    expect(isMailReady(config, false)).toBe(false);
    expect(isMailReady(config, true)).toBe(true);
  });

  it('notifies requester and IT on new tickets, requester only on public replies', () => {
    const config = {
      notify_requester: true,
      notify_it: true,
      it_inbox: 'it@acme.com',
    };
    const ticket = { requester_email: 'ada@acme.com' };
    expect(ticketMailRecipients(config, ticket, 'created').map((item) => item.email)).toEqual([
      'ada@acme.com',
      'it@acme.com',
    ]);
    expect(ticketMailRecipients(config, ticket, 'public_reply').map((item) => item.email)).toEqual([
      'ada@acme.com',
    ]);
  });
});
