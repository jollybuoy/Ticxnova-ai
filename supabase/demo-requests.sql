-- Optional backup store for public demo requests (used by book-demo edge function)
create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  company text not null,
  team_size text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.demo_requests enable row level security;

-- No public policies: only service role (edge function) can insert/read
