-- Wonder Pages — database + storage schema (Croatia validation shop).
-- Paste this into Supabase → SQL Editor and run it once.
--
-- The product is a shop selling a pre-built, personalized printed keepsake.
-- There is no online payment and no accounts: a visitor picks the product +
-- options + the child's name, previews it, chooses delivery (BoxNow / Hrvatska
-- pošta), and places an order. We email payment instructions (bank transfer)
-- and fulfil by hand. Everything is written server-side with the service-role
-- key, so RLS stays closed to clients.

-- ──────────────────────────────────────────────────────────────
-- Retire the v1 "studio" tables and the deferred online-checkout tables
-- (user-generated games, credits, Stripe/Lulu orders, email capture).
-- Safe to run repeatedly; drops only if present.
-- ──────────────────────────────────────────────────────────────
drop table if exists public.booklet_pages cascade;
drop table if exists public.booklets cascade;
drop table if exists public.games cascade;
drop table if exists public.payments cascade;
drop table if exists public.waitlist cascade;
drop table if exists public.profiles cascade;
drop table if exists public.orders cascade;
drop table if exists public.notify_emails cascade;
drop function if exists public.consume_credit(uuid) cascade;
drop function if exists public.increment_credits(uuid, integer) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.touch_updated_at() cascade;

-- ──────────────────────────────────────────────────────────────
-- storage bucket for artwork: catalog coloring line art, rendered
-- covers, and print-ready PDFs. Public read (the on-site preview fetches
-- images directly). Writes are server-side only.
-- ──────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('pages', 'pages', true)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────
-- coloring_catalog — pre-generated blank coloring line art, the source
-- of the activity book's coloring pages. Built once by
-- scripts/build-coloring-catalog.mjs. Server-only (resolved into book
-- plans server-side); the images themselves are public via storage.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.coloring_catalog (
  id          uuid primary key default gen_random_uuid(),
  theme       text not null,
  difficulty  text not null default 'medium'
              check (difficulty in ('easy', 'medium', 'hard')),
  image_url   text not null,
  created_at  timestamptz not null default now()
);

create index if not exists coloring_catalog_theme_diff_idx
  on public.coloring_catalog (theme, difficulty);

alter table public.coloring_catalog enable row level security;
-- No client policy: read/written only with the service-role key.

-- ──────────────────────────────────────────────────────────────
-- order_requests — the Croatia validation shop. A manual order flow, not a
-- live payment one: a visitor places an order (full buyer + delivery details
-- + the gift's personalization), picks a delivery method, and we email payment
-- instructions (bank transfer) then fulfil by hand. A full delivery address +
-- "place order" intent at the shown price is the real buying signal. Inserted
-- server-side; RLS on with no policy = no client access.
-- ──────────────────────────────────────────────────────────────
create table if not exists public.order_requests (
  id            uuid primary key default gen_random_uuid(),
  -- buyer
  full_name     text not null,
  email         text not null,
  phone         text,
  -- delivery (Croatia only for now)
  street        text not null,
  city          text not null,
  postcode      text not null,
  country       text not null default 'HR',
  delivery_method text check (delivery_method in ('boxnow','posta')),
  quantity      integer not null default 1 check (quantity between 1 and 20),
  -- the gift (who it's for) + personalization
  product       text not null default 'alphabet'
                check (product in ('activity','alphabet','bundle')),
  child_name    text,
  child_surname text,                 -- alphabet: shown on the diploma leaf
  child_gender  text check (child_gender in ('boy','girl')),  -- alphabet: diploma wording (Naučio/Naučila)
  child_age     integer check (child_age between 3 and 8),
  theme         text,                 -- activity / bundle option
  language      text check (language in ('en','hr')),  -- alphabet / bundle option
  occasion      text,
  deadline      date,
  note          text,
  dedication    text,                 -- alphabet: the free-written "posveta" leaf
  -- the price they saw when they ordered (willingness-to-pay signal)
  price_cents   integer not null default 1500,
  currency      text not null default 'eur',
  -- meta: which language they used, where they came from, lifecycle
  locale        text check (locale in ('hr','en')),
  source        text,                 -- utm/referrer tag (linkedin, instagram…)
  order_group   uuid,                  -- ties the rows of one multi-child order together (one row per child)
  status        text not null default 'pending_confirmation'
                check (status in ('pending_confirmation','contacted','confirmed','paid','fulfilled','cancelled')),
  created_at    timestamptz not null default now()
);

-- Idempotent for existing installs.
alter table public.order_requests add column if not exists child_surname   text;
alter table public.order_requests add column if not exists dedication      text;
alter table public.order_requests add column if not exists child_gender    text;
alter table public.order_requests add column if not exists delivery_method text;
alter table public.order_requests add column if not exists order_group     uuid;
do $$ begin
  alter table public.order_requests
    add constraint order_requests_child_gender_chk check (child_gender in ('boy','girl'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.order_requests
    add constraint order_requests_delivery_method_chk check (delivery_method in ('boxnow','posta'));
exception when duplicate_object then null; end $$;

create index if not exists order_requests_created_idx
  on public.order_requests (created_at desc);

-- group the rows of one multi-child order
create index if not exists order_requests_group_idx
  on public.order_requests (order_group);
create index if not exists order_requests_status_idx
  on public.order_requests (status);

alter table public.order_requests enable row level security;
-- No client policy: written only with the service-role key (the /api/order
-- route); reviewed in the Supabase dashboard.
