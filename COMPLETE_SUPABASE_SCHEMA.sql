-- AfriSommelier / Enoviq complete Supabase backend schema
-- Paste this entire file into the Supabase SQL editor for a clean production backend.
-- It is idempotent and intentionally does not insert mock/demo data.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Core tables
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  first_name text,
  identity text,
  role text not null default 'explorer' check (role in ('explorer', 'lead_sommelier', 'admin', 'super_admin', 'suspended')),
  flavors jsonb default '[]'::jsonb,
  regions jsonb default '[]'::jsonb,
  interests jsonb default '[]'::jsonb,
  sweet_dry text,
  light_full text,
  fruity_earthy text,
  location text,
  avatar_url text,
  taste_dna jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  producer text,
  region text,
  country text default 'South Africa',
  grape text,
  vintage text,
  price text,
  image text,
  notes text,
  rating numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cellar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vintage text,
  region text,
  grape text,
  status text,
  status_color text,
  image text,
  rating numeric,
  awards text,
  price text,
  abv text,
  calories_per_glass numeric,
  is_organic boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vintage text,
  region text,
  grape text,
  image text,
  price text,
  created_at timestamptz not null default now()
);

-- Keep existing production databases aligned when this idempotent schema is rerun.
alter table public.wishlist add column if not exists grape text;

create table if not exists public.consumption (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wine_name text,
  region text,
  grape text,
  calories numeric,
  date timestamptz default now(),
  rating numeric,
  notes text,
  occasion text,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  event_date timestamptz not null,
  time text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wine_name text not null,
  rating numeric,
  review_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  category text,
  image text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  timestamp bigint not null,
  mode text not null check (mode in ('label', 'menu', 'winelist')),
  preview_url text,
  result jsonb not null,
  barcode text,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- KYC/KYB identity assurance inspired by open-source Ballerine-style case workflows
-- -----------------------------------------------------------------------------
create table if not exists public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workflow_type text not null default 'kyc' check (workflow_type in ('kyc', 'kyb')),
  status text not null default 'not_started' check (status in ('not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired')),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  assurance_level integer not null default 0 check (assurance_level between 0 and 3),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id) on delete set null,
  evidence jsonb not null default '{}'::jsonb,
  checks jsonb not null default '{}'::jsonb,
  rejection_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workflow_type)
);

-- -----------------------------------------------------------------------------
-- Admin operations
-- -----------------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'Open' check (status in ('Open', 'Resolved')),
  category text not null check (category in ('Fraud Reporting', 'Sommelier Support', 'App Feedback', 'Wine Listing Error')),
  reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  wine_name text not null,
  discount text not null,
  target text not null,
  active boolean not null default true,
  image text,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Cupido realtime social matching
-- -----------------------------------------------------------------------------
create table if not exists public.cupido_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  photo_url text,
  wine_type text,
  personality text,
  old_world_affinity integer default 50 check (old_world_affinity between 0 and 100),
  bold_reds_affinity integer default 50 check (bold_reds_affinity between 0 and 100),
  luxury_dining_affinity integer default 50 check (luxury_dining_affinity between 0 and 100),
  adventure_affinity integer default 50 check (adventure_affinity between 0 and 100),
  favorite_wines text[] default '{}',
  favorite_experiences text[] default '{}',
  location_name text,
  is_premium boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cupido_swipes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references public.cupido_profiles(id) on delete cascade,
  swipe_type text not null check (swipe_type in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (sender_id, receiver_id)
);

create table if not exists public.cupido_matches (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references public.cupido_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_one_id, user_two_id)
);

create table if not exists public.cupido_conversations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.cupido_matches(id) on delete cascade,
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references public.cupido_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cupido_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.cupido_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cupido_virtual_dates (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.cupido_matches(id) on delete cascade,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references public.cupido_profiles(id) on delete set null,
  scheduled_for timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cupido_event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  registration_code text not null,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists cellar_user_created_idx on public.cellar(user_id, created_at desc);
create index if not exists wishlist_user_created_idx on public.wishlist(user_id, created_at desc);
create index if not exists consumption_user_date_idx on public.consumption(user_id, date desc);
create index if not exists events_user_event_date_idx on public.events(user_id, event_date);
create index if not exists reviews_wine_created_idx on public.reviews(wine_name, created_at desc);
create index if not exists scans_user_timestamp_idx on public.scans(user_id, timestamp desc);
create index if not exists kyc_verifications_user_status_idx on public.kyc_verifications(user_id, status, assurance_level);
create index if not exists cupido_swipes_receiver_idx on public.cupido_swipes(receiver_id, swipe_type);
create index if not exists cupido_event_registrations_user_idx on public.cupido_event_registrations(user_id);

-- -----------------------------------------------------------------------------
-- Updated-at triggers
-- -----------------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists wines_set_updated_at on public.wines;
create trigger wines_set_updated_at before update on public.wines for each row execute function public.set_updated_at();
drop trigger if exists cellar_set_updated_at on public.cellar;
create trigger cellar_set_updated_at before update on public.cellar for each row execute function public.set_updated_at();
drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at before update on public.news for each row execute function public.set_updated_at();
drop trigger if exists kyc_verifications_set_updated_at on public.kyc_verifications;
create trigger kyc_verifications_set_updated_at before update on public.kyc_verifications for each row execute function public.set_updated_at();
drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();
drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at before update on public.promotions for each row execute function public.set_updated_at();
drop trigger if exists cupido_profiles_set_updated_at on public.cupido_profiles;
create trigger cupido_profiles_set_updated_at before update on public.cupido_profiles for each row execute function public.set_updated_at();
drop trigger if exists cupido_conversations_set_updated_at on public.cupido_conversations;
create trigger cupido_conversations_set_updated_at before update on public.cupido_conversations for each row execute function public.set_updated_at();
drop trigger if exists cupido_virtual_dates_set_updated_at on public.cupido_virtual_dates;
create trigger cupido_virtual_dates_set_updated_at before update on public.cupido_virtual_dates for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Auth profile provisioning
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, role)
  values (new.id, new.email, split_part(coalesce(new.email, ''), '@', 1), 'explorer')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- After creating your first account, run this in the SQL editor to bootstrap admin:
-- update public.profiles set role = 'super_admin' where email = 'YOUR_ADMIN_EMAIL@example.com';

-- SECURITY DEFINER helper used by RLS policies to avoid recursive profile policy checks.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('lead_sommelier', 'admin', 'super_admin'), false)
$$;

-- -----------------------------------------------------------------------------
-- RLS policies for app data access
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.wines enable row level security;
alter table public.cellar enable row level security;
alter table public.wishlist enable row level security;
alter table public.consumption enable row level security;
alter table public.events enable row level security;
alter table public.reviews enable row level security;
alter table public.news enable row level security;
alter table public.scans enable row level security;
alter table public.cupido_profiles enable row level security;
alter table public.cupido_swipes enable row level security;
alter table public.cupido_matches enable row level security;
alter table public.cupido_conversations enable row level security;
alter table public.cupido_messages enable row level security;
alter table public.cupido_virtual_dates enable row level security;
alter table public.cupido_event_registrations enable row level security;

-- Paid membership may only be changed by a trusted server-side payment webhook.
-- This prevents a browser client from granting itself access by updating is_premium.
create or replace function public.protect_cupido_membership()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.is_premium := false;
    else
      new.is_premium := old.is_premium;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists cupido_profiles_protect_membership on public.cupido_profiles;
create trigger cupido_profiles_protect_membership
before insert or update on public.cupido_profiles
for each row execute function public.protect_cupido_membership();

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_owner_read') then
    create policy profiles_owner_read on public.profiles for select using (auth.uid() = id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_owner_update') then
    create policy profiles_owner_update on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wines' and policyname = 'wines_public_read') then
    create policy wines_public_read on public.wines for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'news' and policyname = 'news_public_read') then
    create policy news_public_read on public.news for select using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cellar' and policyname = 'cellar_owner_manage') then
    create policy cellar_owner_manage on public.cellar for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wishlist' and policyname = 'wishlist_owner_manage') then
    create policy wishlist_owner_manage on public.wishlist for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'consumption' and policyname = 'consumption_owner_manage') then
    create policy consumption_owner_manage on public.consumption for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'events' and policyname = 'events_owner_manage') then
    create policy events_owner_manage on public.events for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reviews' and policyname = 'reviews_owner_manage') then
    create policy reviews_owner_manage on public.reviews for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scans' and policyname = 'scans_owner_manage') then
    create policy scans_owner_manage on public.scans for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_profiles' and policyname = 'cupido_profiles_authenticated_read') then
    create policy cupido_profiles_authenticated_read on public.cupido_profiles for select using (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_profiles' and policyname = 'cupido_profiles_owner_insert') then
    create policy cupido_profiles_owner_insert on public.cupido_profiles for insert with check (auth.uid() = id or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_profiles' and policyname = 'cupido_profiles_owner_update') then
    create policy cupido_profiles_owner_update on public.cupido_profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_swipes' and policyname = 'cupido_swipes_owner_manage') then
    create policy cupido_swipes_owner_manage on public.cupido_swipes for all using (auth.uid() = sender_id or public.is_admin()) with check (auth.uid() = sender_id or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_matches' and policyname = 'cupido_matches_participant_read') then
    create policy cupido_matches_participant_read on public.cupido_matches for select using (auth.uid() in (user_one_id, user_two_id) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_conversations' and policyname = 'cupido_conversations_participant_read') then
    create policy cupido_conversations_participant_read on public.cupido_conversations for select using (auth.uid() in (user_one_id, user_two_id) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_messages' and policyname = 'cupido_messages_participant_read') then
    create policy cupido_messages_participant_read on public.cupido_messages for select using (exists (select 1 from public.cupido_conversations c where c.id = conversation_id and auth.uid() in (c.user_one_id, c.user_two_id)) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_messages' and policyname = 'cupido_messages_sender_insert') then
    create policy cupido_messages_sender_insert on public.cupido_messages for insert with check (auth.uid() = sender_id and exists (select 1 from public.cupido_conversations c where c.id = conversation_id and auth.uid() in (c.user_one_id, c.user_two_id)));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_virtual_dates' and policyname = 'cupido_virtual_dates_participant_manage') then
    create policy cupido_virtual_dates_participant_manage on public.cupido_virtual_dates for all using (auth.uid() in (host_user_id, guest_user_id) or public.is_admin()) with check (auth.uid() in (host_user_id, guest_user_id) or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cupido_event_registrations' and policyname = 'cupido_event_registrations_owner_manage') then
    create policy cupido_event_registrations_owner_manage on public.cupido_event_registrations for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
  end if;
end $$;

select 'AfriSommelier Supabase backend schema installed without mock/demo data.' as status;
