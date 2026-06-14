-- Wonder Pages — database + storage schema.
-- Paste this into Supabase → SQL Editor and run it once.
-- Also: Authentication → Providers → enable "Anonymous sign-ins".

-- ──────────────────────────────────────────────────────────────
-- games table
-- ──────────────────────────────────────────────────────────────
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('coloring', 'find-it')),
  theme       text not null,
  difficulty  text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  title       text not null,
  image_url   text not null,
  -- find-it: { x, y, w, h, imgW, imgH }; coloring: null
  answer_key  jsonb,
  created_at  timestamptz not null default now()
);

-- Backfill for tables created before difficulty existed.
alter table public.games
  add column if not exists difficulty text not null default 'medium'
  check (difficulty in ('easy', 'medium', 'hard'));

create index if not exists games_user_id_created_idx
  on public.games (user_id, created_at desc);

-- Row Level Security: everyone (including anonymous users) only sees their own.
alter table public.games enable row level security;

drop policy if exists "own games — select" on public.games;
create policy "own games — select" on public.games
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "own games — insert" on public.games;
create policy "own games — insert" on public.games
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "own games — update" on public.games;
create policy "own games — update" on public.games
  for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "own games — delete" on public.games;
create policy "own games — delete" on public.games
  for delete to authenticated
  using (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- storage bucket for generated artwork (public read)
-- ──────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('pages', 'pages', true)
on conflict (id) do nothing;

-- Uploads happen server-side with the service-role key (bypasses RLS),
-- so we only need policies if we ever upload from the browser. Public read
-- is handled by the bucket's `public = true` flag above.

-- ──────────────────────────────────────────────────────────────
-- profiles + credits
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  -- Launch free allowance (no live payments yet). Paid packs will add on top
  -- once the business entity (obrt) is registered and Stripe goes live.
  credits     integer not null default 3,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile — select" on public.profiles;
create policy "own profile — select" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Auto-create a profile row whenever a new auth user (incl. anonymous) appears.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically spend one credit. Returns remaining balance, or -1 if none left.
create or replace function public.consume_credit(uid uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare remaining integer;
begin
  update public.profiles
     set credits = credits - 1
   where id = uid and credits > 0
   returning credits into remaining;
  if not found then
    return -1;
  end if;
  return remaining;
end;
$$;

-- Add credits (called from the Stripe webhook after a successful payment).
create or replace function public.increment_credits(uid uuid, n integer)
returns void language sql security definer set search_path = public as $$
  update public.profiles set credits = credits + n where id = uid;
$$;

-- SECURITY: these SECURITY DEFINER functions bypass RLS, so they must NOT be
-- callable by browser clients (incl. anonymous users) — otherwise anyone could
-- mint themselves credits. We only ever call them server-side with the secret
-- key (service_role). Revoke from everyone, then grant to service_role only.
revoke execute on function public.consume_credit(uuid) from public, anon, authenticated;
revoke execute on function public.increment_credits(uuid, integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.consume_credit(uuid) to service_role;
grant execute on function public.increment_credits(uuid, integer) to service_role;

-- ──────────────────────────────────────────────────────────────
-- payments ledger (idempotency for the Stripe webhook)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id            text primary key,          -- Stripe checkout session id
  user_id       uuid references auth.users (id) on delete cascade,
  credits       integer not null,
  amount_total  integer,
  created_at    timestamptz not null default now()
);

-- Server-only (service role); RLS on with no policy = no client access.
alter table public.payments enable row level security;

-- ──────────────────────────────────────────────────────────────
-- waitlist — demand capture while payments are off (pre-obrt)
-- Records that a user wants more games, and which pack they'd pick.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,
  pack        integer,  -- credits in the pack they tapped (null = general interest)
  created_at  timestamptz not null default now(),
  -- One row per user per pack. `nulls not distinct` so a repeated tap on the
  -- general-interest link (pack = null) collapses too, not just the packs.
  constraint waitlist_user_pack_uniq unique nulls not distinct (user_id, pack)
);

-- Backfill the constraint on databases created before it existed.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'waitlist_user_pack_uniq'
  ) then
    alter table public.waitlist
      add constraint waitlist_user_pack_uniq unique nulls not distinct (user_id, pack);
  end if;
end $$;

alter table public.waitlist enable row level security;

-- Users may register their own interest. No client read (you review demand
-- via the dashboard / service role).
drop policy if exists "own waitlist — insert" on public.waitlist;
create policy "own waitlist — insert" on public.waitlist
  for insert to authenticated
  with check (user_id = auth.uid());
