# platform-admin

Edge function for the internal Ticxnova super admin portal (`/admin`).

## Deploy

```bash
supabase functions deploy platform-admin
```

## Setup

1. Run `supabase/platform-super-admin.sql` in the SQL editor.
2. Ensure `jollybuoytech@gmail.com` exists in Authentication with your chosen password.
3. Sign in at `/admin/login`.

## Actions

- `get_dashboard` — platform analytics
- `list_workspaces` — tenants, domains, admin accounts
- `list_users` — global user directory
- `set_workspace_status` — enable/disable workspace (+ members when disabling)
- `set_user_status` — enable/disable auth user
- `delete_workspace` — remove tenant and member accounts
