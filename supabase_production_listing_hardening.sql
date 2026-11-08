-- Production listing hardening. Apply after the existing schema migrations.
-- This migration makes auth.users the source of truth for ownership and limits
-- anonymous reads to records that have passed moderation.

begin;

alter table public.properties add column if not exists owner_id uuid references auth.users(id) on delete restrict;
alter table public.car_rentals add column if not exists owner_id uuid references auth.users(id) on delete restrict;
alter table public.wellness_services add column if not exists owner_id uuid references auth.users(id) on delete restrict;
alter table public.car_rentals drop constraint if exists car_rentals_user_id_fkey;
alter table public.car_rentals alter column user_id drop not null;
alter table public.wellness_services drop constraint if exists wellness_services_user_id_fkey;
alter table public.wellness_services alter column user_id drop not null;

create table if not exists public.accommodation_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  business_name text not null check (char_length(trim(business_name)) between 2 and 255),
  accommodation_type text not null check (accommodation_type in ('hotel', 'resort', 'guest_house', 'apartment', 'villa', 'lodge')),
  country text not null,
  city text not null,
  address text,
  nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
  currency text not null default 'ZAR' check (char_length(currency) = 3),
  max_guests integer not null check (max_guests > 0),
  description text not null check (char_length(trim(description)) >= 20),
  images text[] not null default '{}',
  status public.service_status not null default 'pending_review',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_public_listing_idx on public.properties (property_type, date_listed desc) where status = 'Active';
create index if not exists car_rentals_public_listing_idx on public.car_rentals (city, created_at desc) where status = 'active';
create index if not exists wellness_services_public_listing_idx on public.wellness_services (city, created_at desc) where status = 'active';
create index if not exists accommodation_services_public_listing_idx on public.accommodation_services (city, created_at desc) where status = 'active';

-- Keep denormalized save counts in sync on the database, rather than exposing a
-- caller-controlled RPC that could be repeatedly invoked to manipulate ranking.
create or replace function public.sync_property_save_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.properties set saves = saves + 1 where id = new.property_id;
  elsif tg_op = 'DELETE' then
    update public.properties set saves = greatest(0, saves - 1) where id = old.property_id;
  end if;
  return null;
end;
$$;
revoke all on function public.sync_property_save_count() from public;
drop trigger if exists sync_property_save_count_on_insert on public.saved_properties;
create trigger sync_property_save_count_on_insert
  after insert on public.saved_properties
  for each row execute function public.sync_property_save_count();
drop trigger if exists sync_property_save_count_on_delete on public.saved_properties;
create trigger sync_property_save_count_on_delete
  after delete on public.saved_properties
  for each row execute function public.sync_property_save_count();

-- Moderation must happen through a trusted administrator claim, never through
-- a mutable browser field. Set app_metadata.role only from a service-role backend.
create or replace function public.review_property_listing(prop_id text, approved boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'super_admin' then
    raise exception 'Administrator role required';
  end if;
  update public.properties
  set status = case when approved then 'Active'::public.property_status_enum else 'Draft'::public.property_status_enum end,
      verified = approved
  where id = prop_id and status = 'Pending Approval';
  if not found then raise exception 'Listing is not awaiting review'; end if;
end;
$$;

create or replace function public.review_service_listing(listing_table regclass, listing_id uuid, approved boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'super_admin' then
    raise exception 'Administrator role required';
  end if;
  if listing_table not in ('public.car_rentals'::regclass, 'public.wellness_services'::regclass, 'public.accommodation_services'::regclass) then
    raise exception 'Unsupported service listing table';
  end if;
  execute format('update %s set status = $1, is_verified = $2 where id = $3 and status = ''pending_review''', listing_table)
    using case when approved then 'active'::public.service_status else 'archived'::public.service_status end, approved, listing_id;
  if not found then raise exception 'Listing is not awaiting review'; end if;
end;
$$;
revoke all on function public.review_property_listing(text, boolean) from public;
revoke all on function public.review_service_listing(regclass, uuid, boolean) from public;
grant execute on function public.review_property_listing(text, boolean) to authenticated;
grant execute on function public.review_service_listing(regclass, uuid, boolean) to authenticated;

-- Remove prototype-wide access. Existing data must be backfilled with owner_id
-- before owners can edit it; legacy rows remain readable only if Active.
drop policy if exists "Allow public select properties" on public.properties;
drop policy if exists "Allow public insert properties" on public.properties;
drop policy if exists "Allow public update properties" on public.properties;
drop policy if exists "Allow public delete properties" on public.properties;
drop policy if exists "Public can view active car rentals" on public.car_rentals;
drop policy if exists "Users can view their own car rentals" on public.car_rentals;
drop policy if exists "Users can insert their own car rentals" on public.car_rentals;
drop policy if exists "Users can update their own car rentals" on public.car_rentals;
drop policy if exists "Allow public select car_rentals" on public.car_rentals;
drop policy if exists "Allow public insert car_rentals" on public.car_rentals;
drop policy if exists "Allow public update car_rentals" on public.car_rentals;
drop policy if exists "Allow public delete car_rentals" on public.car_rentals;
drop policy if exists "Public can view active wellness services" on public.wellness_services;
drop policy if exists "Users can view their own wellness services" on public.wellness_services;
drop policy if exists "Users can insert their own wellness services" on public.wellness_services;
drop policy if exists "Users can update their own wellness services" on public.wellness_services;
drop policy if exists "Allow public select wellness_services" on public.wellness_services;
drop policy if exists "Allow public insert wellness_services" on public.wellness_services;
drop policy if exists "Allow public update wellness_services" on public.wellness_services;
drop policy if exists "Allow public delete wellness_services" on public.wellness_services;

alter table public.properties enable row level security;
alter table public.car_rentals enable row level security;
alter table public.wellness_services enable row level security;
alter table public.accommodation_services enable row level security;

create policy "Public reads published properties" on public.properties for select using (status = 'Active' or owner_id = auth.uid());
create policy "Owners create property drafts" on public.properties for insert with check (owner_id = auth.uid() and status in ('Draft', 'Pending Approval'));
create policy "Owners update own unpublished properties" on public.properties for update using (owner_id = auth.uid() and status in ('Draft', 'Pending Approval')) with check (owner_id = auth.uid() and status in ('Draft', 'Pending Approval'));
create policy "Owners delete own unpublished properties" on public.properties for delete using (owner_id = auth.uid() and status in ('Draft', 'Pending Approval'));

create policy "Public reads active car rentals" on public.car_rentals for select using (status = 'active' or owner_id = auth.uid());
create policy "Owners create car rental submissions" on public.car_rentals for insert with check (owner_id = auth.uid() and status = 'pending_review');
create policy "Owners update own pending car rentals" on public.car_rentals for update using (owner_id = auth.uid() and status = 'pending_review') with check (owner_id = auth.uid() and status = 'pending_review');
create policy "Public reads active wellness services" on public.wellness_services for select using (status = 'active' or owner_id = auth.uid());
create policy "Owners create wellness submissions" on public.wellness_services for insert with check (owner_id = auth.uid() and status = 'pending_review');
create policy "Owners update own pending wellness services" on public.wellness_services for update using (owner_id = auth.uid() and status = 'pending_review') with check (owner_id = auth.uid() and status = 'pending_review');
create policy "Public reads active accommodation services" on public.accommodation_services for select using (status = 'active' or owner_id = auth.uid());
create policy "Owners create accommodation submissions" on public.accommodation_services for insert with check (owner_id = auth.uid() and status = 'pending_review');
create policy "Owners update own pending accommodation services" on public.accommodation_services for update using (owner_id = auth.uid() and status = 'pending_review') with check (owner_id = auth.uid() and status = 'pending_review');

commit;
