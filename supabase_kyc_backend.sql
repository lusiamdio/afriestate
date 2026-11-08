-- =======================================================================================
-- AFRIESTATE — BIOMETRIC KYC BACKEND HARDENING
-- =======================================================================================
-- Apply after supabase_complete_schema.sql and supabase_production_hardening.sql.
-- This migration creates the Supabase backend required by the FaceOnLive-backed KYC flow.
-- FaceOnLive SDK repository: https://github.com/FaceOnLive/Face-Recognition-SDK-Windows.git
--
-- Security model:
-- - The browser may create/refresh only its own pending KYC submission record.
-- - Raw biometric processing must happen in a private Windows service that wraps FaceOnLive.
-- - The private service writes provider scores/results through service-role RPCs only.
-- - Investor deal requests are blocked unless the investor has Approved KYC.
-- - Raw files live in the private `kyc-documents` storage bucket and are path-scoped by auth.uid().
-- =======================================================================================

begin;

-- ---------------------------------------------------------------------------------------
-- 1) Shared helper functions used by policies and triggers.
-- ---------------------------------------------------------------------------------------
create or replace function public.current_username()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', auth.uid()::text)
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'user')
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role(), '') = 'service_role'
$$;

-- ---------------------------------------------------------------------------------------
-- 2) Profile-level KYC status for quick UI gating.
-- ---------------------------------------------------------------------------------------
alter table if exists public.profiles
  add column if not exists id uuid references auth.users(id) on delete cascade;

alter table if exists public.profiles
  add column if not exists kyc_status text not null default 'Not Started'
  check (kyc_status in ('Not Started', 'Pending Review', 'Needs Manual Review', 'Approved', 'Rejected'));

create index if not exists idx_profiles_kyc_status on public.profiles(kyc_status);

-- ---------------------------------------------------------------------------------------
-- 3) KYC verification table. This stores normalized metadata only, not biometric templates.
-- ---------------------------------------------------------------------------------------
create table if not exists public.kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null references public.profiles(username) on delete cascade,
  role text not null check (role in ('user', 'agent', 'investor')),
  status text not null default 'Pending Review'
    check (status in ('Not Started', 'Pending Review', 'Needs Manual Review', 'Approved', 'Rejected')),
  provider text not null default 'FaceOnLive Face Recognition SDK for Windows',
  repository_url text not null default 'https://github.com/FaceOnLive/Face-Recognition-SDK-Windows.git',
  document_type text,
  document_storage_path text,
  selfie_storage_path text,
  face_match_score numeric(5,4) check (face_match_score is null or (face_match_score >= 0 and face_match_score <= 1)),
  liveness_score numeric(5,4) check (liveness_score is null or (liveness_score >= 0 and liveness_score <= 1)),
  provider_reference text,
  provider_payload jsonb not null default '{}'::jsonb,
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (username),
  unique (user_id)
);

create index if not exists idx_kyc_verifications_username on public.kyc_verifications(username);
create index if not exists idx_kyc_verifications_user_id on public.kyc_verifications(user_id);
create index if not exists idx_kyc_verifications_status on public.kyc_verifications(status);
create index if not exists idx_kyc_verifications_provider_reference on public.kyc_verifications(provider_reference);

alter table public.kyc_verifications enable row level security;

-- ---------------------------------------------------------------------------------------
-- 4) Audit events for KYC status changes and provider callbacks.
-- ---------------------------------------------------------------------------------------
create table if not exists public.kyc_audit_events (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid references public.kyc_verifications(id) on delete cascade,
  actor_username text,
  actor_role text not null default coalesce(auth.role(), 'unknown'),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_kyc_audit_events_verification_id on public.kyc_audit_events(verification_id);
create index if not exists idx_kyc_audit_events_created_at on public.kyc_audit_events(created_at desc);

alter table public.kyc_audit_events enable row level security;

-- ---------------------------------------------------------------------------------------
-- 5) Private storage bucket for ID documents and live selfies.
-- ---------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------------------
-- 6) Reset KYC policies idempotently.
-- ---------------------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('kyc_verifications', 'kyc_audit_events')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;

  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'kyc_documents_%'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

create policy kyc_verifications_select_own_or_service
  on public.kyc_verifications for select
  using (public.is_service_role() or auth.uid() = user_id or username = public.current_username());

create policy kyc_verifications_insert_own_pending
  on public.kyc_verifications for insert
  with check (
    public.is_service_role()
    or (
      auth.uid() = user_id
      and username = public.current_username()
      and status in ('Not Started', 'Pending Review')
      and face_match_score is null
      and liveness_score is null
      and provider_payload = '{}'::jsonb
    )
  );

create policy kyc_verifications_update_own_pending_or_service
  on public.kyc_verifications for update
  using (
    public.is_service_role()
    or (
      auth.uid() = user_id
      and username = public.current_username()
      and status in ('Not Started', 'Pending Review', 'Needs Manual Review')
    )
  )
  with check (
    public.is_service_role()
    or (
      auth.uid() = user_id
      and username = public.current_username()
      and status in ('Pending Review', 'Needs Manual Review')
      and face_match_score is null
      and liveness_score is null
    )
  );

create policy kyc_audit_events_select_own_or_service
  on public.kyc_audit_events for select
  using (
    public.is_service_role()
    or exists (
      select 1
      from public.kyc_verifications kv
      where kv.id = kyc_audit_events.verification_id
        and (kv.user_id = auth.uid() or kv.username = public.current_username())
    )
  );

create policy kyc_audit_events_insert_service_only
  on public.kyc_audit_events for insert
  with check (public.is_service_role());

create policy kyc_documents_select_own
  on storage.objects for select
  using (bucket_id = 'kyc-documents' and (public.is_service_role() or owner = auth.uid()));

create policy kyc_documents_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'kyc-documents'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy kyc_documents_update_own_pending
  on storage.objects for update
  using (bucket_id = 'kyc-documents' and owner = auth.uid())
  with check (bucket_id = 'kyc-documents' and owner = auth.uid());

-- ---------------------------------------------------------------------------------------
-- 7) Triggers keep updated_at/profile status synced and write auditable status changes.
-- ---------------------------------------------------------------------------------------
create or replace function public.touch_kyc_verification()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_kyc_verification on public.kyc_verifications;
create trigger trg_touch_kyc_verification
  before update on public.kyc_verifications
  for each row execute function public.touch_kyc_verification();

create or replace function public.sync_profile_kyc_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set kyc_status = new.status
   where username = new.username;

  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.kyc_audit_events (verification_id, actor_username, actor_role, action, metadata)
    values (
      new.id,
      coalesce(new.reviewed_by, new.username),
      coalesce(auth.role(), 'system'),
      'kyc_status_changed',
      jsonb_build_object('from', case when tg_op = 'INSERT' then null else old.status end, 'to', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_kyc_status on public.kyc_verifications;
create trigger trg_sync_profile_kyc_status
  after insert or update of status on public.kyc_verifications
  for each row execute function public.sync_profile_kyc_status();

-- ---------------------------------------------------------------------------------------
-- 8) RPCs: browser submission + service-role provider result ingestion.
-- ---------------------------------------------------------------------------------------
create or replace function public.submit_kyc_verification(
  p_document_type text,
  p_document_storage_path text,
  p_selfie_storage_path text
)
returns public.kyc_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_record public.kyc_verifications%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required to submit KYC.' using errcode = '28000';
  end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid() or username = public.current_username()
  limit 1;

  if not found then
    raise exception 'Profile not found for authenticated user.' using errcode = 'P0002';
  end if;

  if v_profile.role::text not in ('agent', 'investor', 'user', 'client') then
    raise exception 'Unsupported role for KYC submission: %', v_profile.role using errcode = '22023';
  end if;

  insert into public.kyc_verifications (
    user_id,
    username,
    role,
    status,
    document_type,
    document_storage_path,
    selfie_storage_path,
    provider_payload
  ) values (
    auth.uid(),
    v_profile.username,
    case when v_profile.role::text = 'client' then 'user' else v_profile.role::text end,
    'Pending Review',
    p_document_type,
    p_document_storage_path,
    p_selfie_storage_path,
    jsonb_build_object('submitted_at', now(), 'source', 'web')
  )
  on conflict (username) do update set
    status = 'Pending Review',
    document_type = excluded.document_type,
    document_storage_path = excluded.document_storage_path,
    selfie_storage_path = excluded.selfie_storage_path,
    rejection_reason = null,
    provider_payload = public.kyc_verifications.provider_payload || excluded.provider_payload
  returning * into v_record;

  return v_record;
end;
$$;

create or replace function public.faceonlive_update_kyc_result(
  p_username text,
  p_provider_reference text,
  p_face_match_score numeric,
  p_liveness_score numeric,
  p_provider_payload jsonb default '{}'::jsonb,
  p_rejection_reason text default null
)
returns public.kyc_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_record public.kyc_verifications%rowtype;
begin
  if not public.is_service_role() then
    raise exception 'Only the service role may write FaceOnLive provider results.' using errcode = '42501';
  end if;

  if p_face_match_score is null or p_liveness_score is null then
    v_status := 'Needs Manual Review';
  elsif p_face_match_score >= 0.82 and p_liveness_score >= 0.82 then
    v_status := 'Approved';
  else
    v_status := 'Needs Manual Review';
  end if;

  update public.kyc_verifications
     set status = v_status,
         provider_reference = p_provider_reference,
         face_match_score = p_face_match_score,
         liveness_score = p_liveness_score,
         provider_payload = coalesce(p_provider_payload, '{}'::jsonb),
         rejection_reason = case when v_status = 'Approved' then null else p_rejection_reason end,
         reviewed_by = 'faceonlive-service',
         reviewed_at = now(),
         expires_at = case when v_status = 'Approved' then now() + interval '12 months' else null end
   where username = p_username
   returning * into v_record;

  if not found then
    raise exception 'KYC verification not found for username %', p_username using errcode = 'P0002';
  end if;

  insert into public.kyc_audit_events (verification_id, actor_username, actor_role, action, metadata)
  values (
    v_record.id,
    'faceonlive-service',
    'service_role',
    'faceonlive_result_received',
    jsonb_build_object(
      'provider_reference', p_provider_reference,
      'face_match_score', p_face_match_score,
      'liveness_score', p_liveness_score,
      'status', v_status
    )
  );

  return v_record;
end;
$$;

-- ---------------------------------------------------------------------------------------
-- 9) Enforce approved KYC before investor deal requests at database level.
-- ---------------------------------------------------------------------------------------
create or replace function public.has_approved_kyc(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.kyc_verifications kv
    where kv.username = p_username
      and kv.status = 'Approved'
      and (kv.expires_at is null or kv.expires_at > now())
  )
$$;

create or replace function public.require_approved_kyc_for_investment_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_approved_kyc(new.investor_username) then
    raise exception 'Approved biometric KYC is required before creating investment requests.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_require_approved_kyc_for_investment_request on public.investment_requests;
create trigger trg_require_approved_kyc_for_investment_request
  before insert on public.investment_requests
  for each row execute function public.require_approved_kyc_for_investment_request();

drop policy if exists investment_requests_insert_investor on public.investment_requests;
create policy investment_requests_insert_investor
  on public.investment_requests for insert
  with check (
    public.current_app_role() = 'investor'
    and investor_username = public.current_username()
    and public.has_approved_kyc(investor_username)
  );

commit;
