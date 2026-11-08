-- AfriEstate production hardening migration.
-- Apply with the Supabase migration runner before exposing the production anon key.
-- This migration assumes the app username is the authenticated user's email.

begin;

-- Credentials belong exclusively to auth.users. Existing plaintext credentials must
-- be removed before this migration is applied to a production database.
alter table public.profiles drop column if exists password;

-- New sign-ups are always unprivileged. A trusted backend may promote a verified
-- user by updating public.profiles and auth.users.app_metadata after review.
alter type public.role_type rename value 'client' to 'user';
alter table public.profiles alter column role set default 'user';

-- Canonical relationships for investor-to-agent work. Requests are private to the
-- investor until an agent is explicitly assigned by a privileged backend process.
alter table public.investment_requests
  add column if not exists assigned_agent_username text references public.profiles(username) on delete set null;

-- Remove prototype policies. RLS stays enabled on every table.
do $$
declare policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and policyname like 'Allow public %'
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

-- Authenticated identity helper. Never trust a username supplied by the browser.
create or replace function public.current_username()
returns text language sql stable security definer set search_path = public as $$
  select email from auth.users where id = auth.uid()
$$;

create or replace function public.create_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (username, full_name, email, role, phone)
  values (
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    'user'::public.role_type,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (username) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.profiles.phone);
  return new;
end;
$$;

drop trigger if exists create_profile_on_auth_signup on auth.users;
create trigger create_profile_on_auth_signup
  after insert on auth.users for each row execute procedure public.create_profile_for_auth_user();

insert into public.profiles (username, full_name, email, role)
select email, coalesce(raw_user_meta_data ->> 'full_name', email), email,
       'user'::public.role_type
from auth.users
where email is not null
on conflict (username) do nothing;

create policy "profiles: read own" on public.profiles for select to authenticated using (username = public.current_username());
create policy "profiles: update own" on public.profiles for update to authenticated using (username = public.current_username()) with check (username = public.current_username());

create policy "properties: public active read" on public.properties for select using (status = 'Active');
create policy "properties: agent manage own" on public.properties for all to authenticated
  using (agent_name = public.current_username()) with check (agent_name = public.current_username());

create policy "saved properties: owner only" on public.saved_properties for all to authenticated
  using (username = public.current_username()) with check (username = public.current_username());
create policy "saved searches: owner only" on public.saved_searches for all to authenticated
  using (username = public.current_username()) with check (username = public.current_username());
create policy "calendar: owner only" on public.calendar_events for all to authenticated
  using (username = public.current_username()) with check (username = public.current_username());
create policy "notifications: recipient only" on public.notifications for select to authenticated using (username = public.current_username());
create policy "notifications: recipient read state" on public.notifications for update to authenticated using (username = public.current_username()) with check (username = public.current_username());
create policy "settings: owner only" on public.investor_settings for all to authenticated
  using (username = public.current_username()) with check (username = public.current_username());
create policy "documents: owner only" on public.user_documents for all to authenticated
  using (username = public.current_username()) with check (username = public.current_username());
create policy "alerts: owner only" on public.property_alerts for all to authenticated
  using (username = public.current_username()) with check (username = public.current_username());

create policy "messages: participants read" on public.messages for select to authenticated
  using (sender = public.current_username() or receiver = public.current_username());
create policy "messages: sender creates" on public.messages for insert to authenticated
  with check (sender = public.current_username());
create policy "messages: receiver updates" on public.messages for update to authenticated
  using (receiver = public.current_username()) with check (receiver = public.current_username());

create policy "tours: requester or listing agent reads" on public.tour_requests for select to authenticated using (
  client_username = public.current_username() or exists (
    select 1 from public.properties p where p.id = property_id and p.agent_name = public.current_username()
  )
);
create policy "tours: requester creates" on public.tour_requests for insert to authenticated
  with check (client_username = public.current_username());
create policy "tours: requester or listing agent updates" on public.tour_requests for update to authenticated using (
  client_username = public.current_username() or exists (
    select 1 from public.properties p where p.id = property_id and p.agent_name = public.current_username()
  )
);

create policy "investment requests: investor or assigned agent reads" on public.investment_requests for select to authenticated
  using (investor_username = public.current_username() or assigned_agent_username = public.current_username());
create policy "investment requests: investor creates" on public.investment_requests for insert to authenticated
  with check (investor_username = public.current_username() and assigned_agent_username is null);

-- Reviews are public, but only an authenticated user can create one under their identity.
create policy "reviews: public read" on public.reviews for select using (true);
create policy "reviews: author creates" on public.reviews for insert to authenticated with check (reviewer_username = public.current_username());

-- Profile provisioning and assigning agents are privileged server-side operations.
-- Use an Auth trigger/Edge Function with the service role; never grant browser clients
-- direct profile inserts, role changes, notification inserts, or request assignment.
commit;
