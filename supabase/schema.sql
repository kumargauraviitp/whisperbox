create table if not exists public.app_users (
  id text primary key,
  username text not null unique,
  username_display text not null,
  password_hash text not null,
  created_at bigint not null,
  last_seen_at bigint not null,
  ip_address text,
  user_agent text,
  constraint app_users_username_format check (username ~ '^[a-z0-9_.-]{3,50}$')
);

create table if not exists public.messages (
  id text primary key,
  sender_username text not null references public.app_users(username) on update cascade on delete restrict,
  content text not null,
  created_at bigint not null,
  reply text,
  replied_at bigint,
  ip_address text,
  user_agent text
);

create index if not exists idx_messages_username on public.messages(sender_username);
create index if not exists idx_messages_created on public.messages(created_at desc);

create table if not exists public.admin_config (
  key text primary key,
  value text not null
);

create table if not exists public.rate_limit_log (
  ip text not null,
  endpoint text not null,
  timestamp bigint not null
);

create index if not exists idx_rate_limit on public.rate_limit_log(ip, endpoint, timestamp);

alter table public.app_users enable row level security;
alter table public.messages enable row level security;
alter table public.admin_config enable row level security;
alter table public.rate_limit_log enable row level security;

create table if not exists public.push_subscriptions (
  id text primary key,
  target text not null,
  subscription jsonb not null,
  created_at bigint not null
);

create index if not exists idx_push_subscriptions_target on public.push_subscriptions(target);
-- Speeds up dedup lookups by push endpoint within a target.
create index if not exists idx_push_subscriptions_endpoint on public.push_subscriptions(target, (subscription->>'endpoint'));

alter table public.push_subscriptions enable row level security;
