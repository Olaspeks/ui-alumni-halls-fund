-- =====================================================================
-- UI Alumni Halls Fund — Supabase schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New
-- query -> paste -> Run), or via `supabase db push` if you use the CLI.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type donor_role as enum ('donor', 'staff_admin', 'finance_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type donation_currency as enum ('NGN', 'USD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('paystack', 'stripe', 'mock');
exception when duplicate_object then null; end $$;

do $$ begin
  create type donation_status as enum ('pending', 'success', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- profiles — one row per auth.users row, carries the role.
-- Created automatically by a trigger on auth.users insert.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role donor_role not null default 'donor',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', 'donor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- halls
-- ---------------------------------------------------------------------
create table if not exists public.halls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  blurb text,
  photo_url text, -- reserved for later, not used in V1 UI
  sort_order int not null default 0,
  is_placeholder boolean not null default false, -- true for the 2 unconfirmed rows
  goal_kobo bigint not null default 0,    -- NGN goal, integer subunits
  raised_kobo bigint not null default 0,  -- NGN raised, integer subunits
  goal_cents bigint not null default 0,   -- USD goal, integer subunits
  raised_cents bigint not null default 0, -- USD raised, integer subunits
  onchain_ngn_tx_hash text, -- last on-chain confirmation stamp for NGN total
  onchain_usd_tx_hash text, -- last on-chain confirmation stamp for USD total
  created_at timestamptz not null default now()
);

create index if not exists halls_sort_order_idx on public.halls (sort_order);

-- ---------------------------------------------------------------------
-- donations
-- ---------------------------------------------------------------------
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.halls (id) on delete restrict,
  donor_id uuid references public.profiles (id) on delete set null, -- null for guests
  donor_name text, -- null/blank displays as "Anonymous"
  donor_email text not null,
  amount bigint not null, -- integer subunits (kobo or cents), always > 0
  currency donation_currency not null,
  payment_provider payment_provider not null,
  provider_ref text not null,
  status donation_status not null default 'pending',
  is_anonymous boolean not null default false,
  receipt_sent_at timestamptz,
  receipt_token uuid not null default gen_random_uuid(), -- guest receipt link key
  onchain_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint donations_amount_positive check (amount > 0),
  constraint donations_provider_ref_unique unique (payment_provider, provider_ref)
);

create index if not exists donations_hall_id_idx on public.donations (hall_id);
create index if not exists donations_donor_id_idx on public.donations (donor_id);
create index if not exists donations_status_idx on public.donations (status);
create unique index if not exists donations_receipt_token_idx on public.donations (receipt_token);

-- ---------------------------------------------------------------------
-- fund_movements — finance_admin ledger entries, not smart-contract calls
-- ---------------------------------------------------------------------
create table if not exists public.fund_movements (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.halls (id) on delete restrict,
  amount bigint not null,
  currency donation_currency not null,
  note text not null,
  recorded_by uuid not null references public.profiles (id),
  onchain_tx_hash text,
  created_at timestamptz not null default now(),

  constraint fund_movements_amount_positive check (amount > 0)
);

create index if not exists fund_movements_hall_id_idx on public.fund_movements (hall_id);

-- ---------------------------------------------------------------------
-- Trigger: on donation -> success, bump the hall's running total.
-- Frontend must read halls.raised_kobo / raised_cents, never sum client-side.
-- ---------------------------------------------------------------------
create or replace function public.apply_donation_to_hall()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'success' and (old.status is distinct from 'success') then
    if new.currency = 'NGN' then
      update public.halls set raised_kobo = raised_kobo + new.amount where id = new.hall_id;
    else
      update public.halls set raised_cents = raised_cents + new.amount where id = new.hall_id;
    end if;
  end if;

  -- If a success is ever reversed (e.g. manual correction), back it out.
  if old.status = 'success' and new.status <> 'success' then
    if new.currency = 'NGN' then
      update public.halls set raised_kobo = greatest(0, raised_kobo - new.amount) where id = new.hall_id;
    else
      update public.halls set raised_cents = greatest(0, raised_cents - new.amount) where id = new.hall_id;
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_donation_status_change on public.donations;
create trigger on_donation_status_change
  before update on public.donations
  for each row execute procedure public.apply_donation_to_hall();

-- Also cover the (rare) case a row is inserted already 'success' (e.g. seed data).
create or replace function public.apply_donation_to_hall_on_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'success' then
    if new.currency = 'NGN' then
      update public.halls set raised_kobo = raised_kobo + new.amount where id = new.hall_id;
    else
      update public.halls set raised_cents = raised_cents + new.amount where id = new.hall_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_donation_insert on public.donations;
create trigger on_donation_insert
  after insert on public.donations
  for each row execute procedure public.apply_donation_to_hall_on_insert();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.halls enable row level security;
alter table public.donations enable row level security;
alter table public.fund_movements enable row level security;

-- profiles: a user can read/update only their own row. Admin role checks
-- happen server-side (service role), never via a client-readable policy.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- halls: publicly readable (goal/raised totals are meant to be public).
drop policy if exists "halls_public_read" on public.halls;
create policy "halls_public_read" on public.halls
  for select using (true);
-- No public insert/update/delete policy -> only the service role (server) can write.

-- donations: a signed-in donor can read only their own rows (used by
-- /account). Guests read a single donation via its unquessable
-- receipt_token, but that lookup is done server-side with the service
-- role (see app/receipt/[token]/page.tsx) — never through a client-side
-- RLS policy, because RLS can't enforce "exact token match only, never
-- listable" on its own.
drop policy if exists "donations_owner_read" on public.donations;
create policy "donations_owner_read" on public.donations
  for select using (auth.uid() = donor_id);
-- No insert/update/delete policy -> all writes happen server-side via the
-- service role key (webhooks + admin routes only).

-- Public-safe view of successful donations (name hidden when anonymous).
-- Not currently linked from any page in V1, but kept available for a
-- future public recent-gifts feed without ever needing a new RLS rule.
create or replace view public.public_donations as
select
  d.id,
  d.hall_id,
  case when d.is_anonymous then null else d.donor_name end as donor_name,
  d.amount,
  d.currency,
  d.status,
  d.is_anonymous,
  d.created_at
from public.donations d
where d.status = 'success';

grant select on public.public_donations to anon, authenticated;

-- fund_movements: no client-side read/write policy at all. /admin always
-- goes through server routes using the service role key, which check the
-- caller's role server-side first (see lib/auth/roles.ts).

-- ---------------------------------------------------------------------
-- Realtime: let the public gauge subscribe to hall total changes.
-- (Views can't be added to a publication, which is why only the base
-- `halls` table — not `public_donations` — is enabled here.)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.halls;

-- =====================================================================
-- Seed: all 15 halls, real confirmed names.
-- Goals are placeholder figures — flagged in README as needing the
-- Dean's sign-off before going live.
-- =====================================================================
insert into public.halls (name, slug, blurb, sort_order, is_placeholder, goal_kobo, goal_cents)
values
  ('Mellanby Hall', 'mellanby-hall', 'One of UI''s founding halls, home to generations of alumni.', 1, false, 500000000, 3000000),
  ('Tedder Hall', 'tedder-hall', 'Historic hall with a long record of student leadership.', 2, false, 500000000, 3000000),
  ('Kuti Hall', 'kuti-hall', 'Named for the Kuti family''s legacy at the university.', 3, false, 500000000, 3000000),
  ('Sultan Bello Hall', 'sultan-bello-hall', 'A landmark residence on the UI campus.', 4, false, 500000000, 3000000),
  ('Nnamdi Azikiwe Hall (Zik Hall)', 'zik-hall', 'Named for Nigeria''s first president.', 5, false, 500000000, 3000000),
  ('Independence Hall', 'independence-hall', 'One of the largest halls of residence at UI.', 6, false, 600000000, 3600000),
  ('Queen Elizabeth II Hall', 'queen-elizabeth-ii-hall', 'A historic hall for female students.', 7, false, 500000000, 3000000),
  ('Queen Idia Hall', 'queen-idia-hall', 'Named for the celebrated Benin queen mother.', 8, false, 500000000, 3000000),
  ('Obafemi Awolowo Hall', 'obafemi-awolowo-hall', 'Named for the statesman and first premier of the Western Region.', 9, false, 500000000, 3000000),
  ('Tafawa Balewa Hall', 'tafawa-balewa-hall', 'Named for Nigeria''s first prime minister.', 10, false, 500000000, 3000000),
  ('Alexander Brown Hall', 'alexander-brown-hall', 'A postgraduate hall of residence.', 11, false, 400000000, 2400000),
  ('Idia Hall', 'idia-hall', 'A women''s hall of residence at UI.', 12, false, 500000000, 3000000),
  ('Abdulsalami Abubakar Hall', 'abdulsalami-abubakar-hall', 'Named for the former Nigerian head of state.', 13, false, 500000000, 3000000),
  ('Ayodele Falase Hall', 'ayodele-falase-hall', 'A hall of residence at the University of Ibadan.', 14, false, 400000000, 2400000),
  ('Adetoun Ogunsheye Hall', 'adetoun-ogunsheye-hall', 'A hall of residence at the University of Ibadan.', 15, false, 400000000, 2400000)
on conflict (slug) do nothing;

-- =====================================================================
-- Manual step (README also covers this): create the first staff/finance
-- admin accounts by having them sign up normally (magic link is
-- simplest — Supabase Auth -> dashboard -> Authentication -> Users also
-- works), then promote them here:
--
--   update public.profiles set role = 'finance_admin' where email = 'dean@example.edu.ng';
--   update public.profiles set role = 'staff_admin'   where email = 'staff@example.edu.ng';
--
-- There is deliberately no in-app way to self-assign these roles.
-- =====================================================================
