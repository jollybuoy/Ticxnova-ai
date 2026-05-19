# book-demo

Sends public **Book Demo** form submissions to `ticxnova-ai@jollybuoy.com` via [Resend](https://resend.com).

## Deploy

```bash
supabase functions deploy book-demo
```

## Secrets (Supabase Dashboard → Project Settings → Edge Functions)

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Ticxnova <hello@yourdomain.com>` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically when deployed.

## Database backup (optional)

Run `supabase/demo-requests.sql` so submissions are stored if email delivery is misconfigured.
