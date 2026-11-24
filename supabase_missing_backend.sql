-- =======================================================================================
-- AFRIESTATE — MISSING & SYNCHRONIZATION SQL BACKEND SCRIPT (SUPABASE POSTGRESQL)
-- =======================================================================================
-- Paste this entire script into:
--   Supabase Dashboard -> SQL Editor -> New Query -> Run
--
-- Safe & Idempotent:
--   • Designed to run cleanly after `supabase_production_backend.sql` OR against an
--     existing AfriEstate Supabase database to add all missing tables, columns,
--     triggers, RLS policies, storage bucket rules, RPCs, and Realtime publications.
-- =======================================================================================

BEGIN;

-- ---------------------------------------------------------------------------------------
-- 1. CORE HELPER FUNCTIONS (Idempotent Safeguard)
-- ---------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') = 'service_role', false);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.current_username()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT username FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    lower(auth.jwt() ->> 'email')
  );
$$;

-- ---------------------------------------------------------------------------------------
-- 2. PROFILE CONSISTENCY, OAUTH METADATA FALLBACKS & EXTRA COLUMNS
-- ---------------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_base_username text;
  v_username text;
  v_existing_username text;
  v_requested_role text;
  v_safe_role public.role_type;
  v_full_name text;
  v_avatar text;
  v_is_verified boolean;
  v_kyc_status public.kyc_status_enum;
  v_account_status public.account_status_enum;
BEGIN
  v_email := lower(COALESCE(NEW.email, NEW.id::text || '@afriestate.local'));
  v_base_username := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'username'), ''),
    v_email
  );
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    split_part(v_email, '@', 1)
  );
  v_avatar := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'picture'), '')
  );

  -- Privilege Escalation Protection: super_admin may ONLY come from server-managed raw_app_meta_data
  IF (NEW.raw_app_meta_data ->> 'role') = 'super_admin' THEN
    v_safe_role := 'super_admin';
  ELSE
    v_requested_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'user');
    IF v_requested_role = 'client' THEN
      v_requested_role := 'user';
    END IF;
    IF v_requested_role IN ('user', 'agent', 'investor', 'hotel_manager', 'transport', 'wellness', 'developer', 'agency') THEN
      v_safe_role := v_requested_role::public.role_type;
    ELSE
      v_safe_role := 'user';
    END IF;
  END IF;

  v_is_verified := (v_safe_role IN ('user', 'super_admin'));
  v_kyc_status := CASE
    WHEN v_safe_role IN ('user', 'super_admin') THEN 'Not Started'::public.kyc_status_enum
    ELSE 'Pending Review'::public.kyc_status_enum
  END;
  v_account_status := CASE
    WHEN v_safe_role IN ('user', 'super_admin') THEN 'Active'::public.account_status_enum
    ELSE 'Pending Verification'::public.account_status_enum
  END;

  -- Check if a profile already exists for this user ID or email before inserting
  SELECT username INTO v_existing_username
  FROM public.profiles
  WHERE id = NEW.id OR lower(email) = v_email
  LIMIT 1;

  IF v_existing_username IS NOT NULL THEN
    UPDATE public.profiles
    SET
      id = NEW.id,
      email = v_email,
      full_name = COALESCE(NULLIF(full_name, ''), v_full_name),
      profile_picture = COALESCE(profile_picture, v_avatar),
      last_sign_in_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    WHERE username = v_existing_username;

    v_username := v_existing_username;
  ELSE
    -- Prevent primary key collision if another account already claimed v_base_username
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_base_username) THEN
      v_username := v_base_username || '_' || left(NEW.id::text, 6);
    ELSE
      v_username := v_base_username;
    END IF;

    INSERT INTO public.profiles (
      username,
      id,
      full_name,
      email,
      role,
      phone,
      office_address,
      business_reg_number,
      agent_license,
      investment_type,
      company_name,
      profile_picture,
      is_verified,
      kyc_status,
      status,
      last_sign_in_at
    ) VALUES (
      v_username,
      NEW.id,
      v_full_name,
      v_email,
      v_safe_role,
      NEW.raw_user_meta_data ->> 'phone',
      NEW.raw_user_meta_data ->> 'officeAddress',
      NEW.raw_user_meta_data ->> 'businessRegNumber',
      NEW.raw_user_meta_data ->> 'agentLicense',
      NEW.raw_user_meta_data ->> 'investment_type',
      NEW.raw_user_meta_data ->> 'company_name',
      v_avatar,
      v_is_verified,
      v_kyc_status,
      v_account_status,
      timezone('utc', now())
    );
  END IF;

  IF v_safe_role IN ('agent', 'agency') THEN
    INSERT INTO public.agent_profiles (username, bio, email, phone, profile_picture, active_since)
    VALUES (
      v_username,
      'Accredited AfriEstate Property Advisor.',
      v_email,
      NEW.raw_user_meta_data ->> 'phone',
      v_avatar,
      to_char(now(), 'YYYY')
    )
    ON CONFLICT (username) DO NOTHING;
  ELSIF v_safe_role = 'investor' THEN
    INSERT INTO public.investor_settings (username, settings)
    VALUES (v_username, '{}'::jsonb)
    ON CONFLICT (username) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ---------------------------------------------------------------------------------------
-- 3. FIX `tour_requests` FOREIGN KEYS FOR CAR HIRE, WELLNESS & GUEST BOOKINGS
-- ---------------------------------------------------------------------------------------
-- RentACarPage.tsx & FindWellnessPage.tsx insert non-property IDs (car/wellness IDs)
-- and guest contact emails into `tour_requests`. Strict FKs to `properties(id)` and
-- `profiles(username)` reject valid bookings; replace with flexible attribution + RLS.
ALTER TABLE public.tour_requests DROP CONSTRAINT IF EXISTS tour_requests_property_id_fkey;
ALTER TABLE public.tour_requests DROP CONSTRAINT IF EXISTS tour_requests_username_fkey;

ALTER TABLE public.tour_requests
  ADD COLUMN IF NOT EXISTS requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'property_tour',
  ADD COLUMN IF NOT EXISTS booking_ref text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

DROP TRIGGER IF EXISTS trg_tour_requests_updated_at ON public.tour_requests;
CREATE TRIGGER trg_tour_requests_updated_at
  BEFORE UPDATE ON public.tour_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "tour_requests_scoped" ON public.tour_requests;
DROP POLICY IF EXISTS "tour_requests_select_scoped" ON public.tour_requests;
DROP POLICY IF EXISTS "tour_requests_insert_scoped" ON public.tour_requests;
DROP POLICY IF EXISTS "tour_requests_update_scoped" ON public.tour_requests;
DROP POLICY IF EXISTS "tour_requests_delete_scoped" ON public.tour_requests;

CREATE POLICY "tour_requests_select_scoped" ON public.tour_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      requester_user_id = auth.uid()
      OR lower(username) = lower(COALESCE(public.current_username(), ''))
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_name = public.current_username())
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "tour_requests_insert_scoped" ON public.tour_requests
  FOR INSERT WITH CHECK (
    (
      auth.uid() IS NULL
      AND requester_user_id IS NULL
      AND char_length(trim(username)) >= 3
      AND char_length(trim(property_title)) >= 2
    )
    OR (
      auth.uid() IS NOT NULL
      AND (requester_user_id IS NULL OR requester_user_id = auth.uid())
      AND (lower(username) = lower(COALESCE(public.current_username(), '')) OR public.is_super_admin())
    )
  );

CREATE POLICY "tour_requests_update_scoped" ON public.tour_requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      requester_user_id = auth.uid()
      OR lower(username) = lower(COALESCE(public.current_username(), ''))
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_name = public.current_username())
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY "tour_requests_delete_scoped" ON public.tour_requests
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      requester_user_id = auth.uid()
      OR lower(username) = lower(COALESCE(public.current_username(), ''))
      OR public.is_super_admin()
    )
  );

-- ---------------------------------------------------------------------------------------
-- 4. FIX `kyc_verifications` OWNER UPSERT + PREVENT CLIENT SELF-APPROVAL
-- ---------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_kyc_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_service_role() OR public.is_super_admin()) THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'Pending Review'::public.kyc_status_enum;
      NEW.face_match_score := NULL;
      NEW.liveness_score := NULL;
      NEW.provider_reference := NULL;
      NEW.rejection_reason := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status = 'Approved' THEN
        RAISE EXCEPTION 'Approved KYC verification records cannot be modified directly by user sessions.';
      END IF;
      NEW.status := 'Pending Review'::public.kyc_status_enum;
      NEW.face_match_score := OLD.face_match_score;
      NEW.liveness_score := OLD.liveness_score;
      NEW.provider_reference := OLD.provider_reference;
      NEW.rejection_reason := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_kyc_columns ON public.kyc_verifications;
CREATE TRIGGER trg_protect_kyc_columns
  BEFORE INSERT OR UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_kyc_sensitive_columns();

DROP POLICY IF EXISTS "kyc_update_admin_only" ON public.kyc_verifications;
DROP POLICY IF EXISTS "kyc_update_owner_resubmit_or_admin" ON public.kyc_verifications;
CREATE POLICY "kyc_update_owner_resubmit_or_admin" ON public.kyc_verifications
  FOR UPDATE
  USING (
    ((user_id = auth.uid() OR username = public.current_username())
      AND status IN ('Not Started', 'Pending Review', 'Needs Manual Review', 'Rejected'))
    OR public.is_super_admin()
  )
  WITH CHECK (
    (user_id = auth.uid() OR username = public.current_username())
    OR public.is_super_admin()
  );

-- ---------------------------------------------------------------------------------------
-- 5. MISSING INTERCONNECTED PLATFORM TABLES
-- ---------------------------------------------------------------------------------------

-- 5.1 Unified Cross-Vertical Bookings Ledger (`contexts/PlatformStateContext.tsx`)
CREATE TABLE IF NOT EXISTS public.platform_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text,
  category text NOT NULL CHECK (category IN ('flight', 'short-stay', 'lease-inquiry', 'car-hire', 'wellness')),
  reference text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  city text,
  start_date text,
  end_date text,
  amount_zar numeric(14, 2) NOT NULL DEFAULT 0 CHECK (amount_zar >= 0),
  status text NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Pending', 'Completed', 'Cancelled')),
  customer_name text,
  customer_email text NOT NULL DEFAULT '',
  target_page text NOT NULL CHECK (target_page IN ('book-flights', 'book-a-stay', 'long-term-stays', 'rent-a-car', 'find-wellness')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 5.2 Persistent Scoped Online Settlement Ledger (`server.ts` /api/payments/settle)
-- Strictly enforces the platform boundary: ONLY flight, short-stay, and car-hire may settle online.
CREATE TABLE IF NOT EXISTS public.payment_settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id text NOT NULL UNIQUE,
  transaction_ref text NOT NULL UNIQUE,
  authorization_code text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_category text NOT NULL CHECK (booking_category IN ('flight', 'short-stay', 'car-hire')),
  item_id text,
  item_title text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'ZAR',
  payment_method text NOT NULL CHECK (
    payment_method IN ('Card', 'Ozow Instant EFT', 'Payflex (Pay in 4)', 'M-Pesa / Mobile Money', 'Pay later (mobicred)')
  ),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  status text NOT NULL DEFAULT 'Settled' CHECK (status IN ('Settled', 'Refunded', 'Disputed', 'Cancelled')),
  protection_guarantee text NOT NULL DEFAULT 'AfriEstate Real-Time Verified Settlement & Escrow Protection',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  settled_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 5.3 Cross-Platform Shared Journey & Saved Stays (`contexts/PlatformStateContext.tsx`)
CREATE TABLE IF NOT EXISTS public.user_travel_preferences (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  destination_city text NOT NULL DEFAULT 'Cape Town',
  origin_airport text NOT NULL DEFAULT 'CPT',
  destination_airport text NOT NULL DEFAULT 'LOS',
  check_in_date text,
  return_date text,
  guests_label text NOT NULL DEFAULT '2 guests · 1 room',
  traveler_count integer NOT NULL DEFAULT 2 CHECK (traveler_count >= 1 AND traveler_count <= 20),
  saved_stay_ids text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 5.4 Flight Bookings & Flight Price Alerts (`components/pages/BookFlightsPage.tsx`)
CREATE TABLE IF NOT EXISTS public.flight_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text,
  booking_ref text NOT NULL UNIQUE,
  airline text,
  flight_number text,
  origin_airport text NOT NULL,
  destination_airport text NOT NULL,
  departure_date text NOT NULL,
  return_date text,
  cabin_class text NOT NULL DEFAULT 'Economy',
  passengers integer NOT NULL DEFAULT 1 CHECK (passengers >= 1 AND passengers <= 20),
  passenger_name text,
  passenger_email text,
  total_amount_zar numeric(14, 2) NOT NULL CHECK (total_amount_zar >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  status public.booking_status_enum NOT NULL DEFAULT 'Confirmed',
  itinerary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.flight_price_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  origin_airport text NOT NULL,
  destination_airport text NOT NULL,
  target_price_zar numeric(14, 2) NOT NULL CHECK (target_price_zar > 0),
  departure_date text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 5.5 POPIA / Data Protection / Privacy Subject Rights & Audit Requests (`LegalCompliancePages.tsx`)
CREATE TABLE IF NOT EXISTS public.compliance_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email text NOT NULL,
  requester_name text,
  framework text NOT NULL DEFAULT 'POPIA' CHECK (framework IN ('POPIA', 'GDPR', 'DataProtection', 'Privacy')),
  request_type text NOT NULL CHECK (
    request_type IN ('access_export', 'rectification', 'erasure', 'objection', 'consent_withdrawal')
  ),
  details text,
  status text NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'In Review', 'Fulfilled', 'Rejected')),
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------------------
-- 6. TRIGGERS & INDEXES FOR NEW TABLES
-- ---------------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_platform_bookings_updated_at ON public.platform_bookings;
CREATE TRIGGER trg_platform_bookings_updated_at
  BEFORE UPDATE ON public.platform_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_travel_prefs_updated_at ON public.user_travel_preferences;
CREATE TRIGGER trg_user_travel_prefs_updated_at
  BEFORE UPDATE ON public.user_travel_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_flight_bookings_updated_at ON public.flight_bookings;
CREATE TRIGGER trg_flight_bookings_updated_at
  BEFORE UPDATE ON public.flight_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_flight_price_alerts_updated_at ON public.flight_price_alerts;
CREATE TRIGGER trg_flight_price_alerts_updated_at
  BEFORE UPDATE ON public.flight_price_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_compliance_requests_updated_at ON public.compliance_requests;
CREATE TRIGGER trg_compliance_requests_updated_at
  BEFORE UPDATE ON public.compliance_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_platform_bookings_user_created ON public.platform_bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_bookings_email ON public.platform_bookings(lower(customer_email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_settlements_user ON public.payment_settlements(user_id, settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_settlements_email ON public.payment_settlements(lower(customer_email), settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_user ON public.flight_bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flight_price_alerts_user ON public.flight_price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_requests_status ON public.compliance_requests(status, created_at DESC);

-- ---------------------------------------------------------------------------------------
-- 7. STRICT ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ---------------------------------------------------------------------------------------
ALTER TABLE public.platform_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_requests ENABLE ROW LEVEL SECURITY;

-- 7.1 platform_bookings
DROP POLICY IF EXISTS "platform_bookings_select_scoped" ON public.platform_bookings;
DROP POLICY IF EXISTS "platform_bookings_insert_scoped" ON public.platform_bookings;
DROP POLICY IF EXISTS "platform_bookings_update_scoped" ON public.platform_bookings;
DROP POLICY IF EXISTS "platform_bookings_delete_scoped" ON public.platform_bookings;

CREATE POLICY "platform_bookings_select_scoped" ON public.platform_bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR lower(customer_email) = lower(COALESCE(public.current_username(), ''))
      OR public.is_super_admin()
    )
  );

CREATE POLICY "platform_bookings_insert_scoped" ON public.platform_bookings
  FOR INSERT WITH CHECK (
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND char_length(trim(customer_email)) >= 3
    )
    OR (
      auth.uid() IS NOT NULL
      AND (user_id = auth.uid() OR public.is_super_admin())
    )
  );

CREATE POLICY "platform_bookings_update_scoped" ON public.platform_bookings
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR lower(customer_email) = lower(COALESCE(public.current_username(), ''))
      OR public.is_super_admin()
    )
  );

CREATE POLICY "platform_bookings_delete_scoped" ON public.platform_bookings
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_super_admin())
  );

-- 7.2 payment_settlements (immutable financial receipts for non-admins)
DROP POLICY IF EXISTS "payment_settlements_select_scoped" ON public.payment_settlements;
DROP POLICY IF EXISTS "payment_settlements_insert_scoped" ON public.payment_settlements;
DROP POLICY IF EXISTS "payment_settlements_admin_write" ON public.payment_settlements;

CREATE POLICY "payment_settlements_select_scoped" ON public.payment_settlements
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR lower(customer_email) = lower(COALESCE(public.current_username(), ''))
      OR public.is_super_admin()
    )
  );

CREATE POLICY "payment_settlements_insert_scoped" ON public.payment_settlements
  FOR INSERT WITH CHECK (
    public.is_service_role()
    OR public.is_super_admin()
    OR (
      auth.uid() IS NOT NULL
      AND user_id = auth.uid()
      AND booking_category IN ('flight', 'short-stay', 'car-hire')
    )
  );

CREATE POLICY "payment_settlements_admin_write" ON public.payment_settlements
  FOR UPDATE USING (public.is_service_role() OR public.is_super_admin())
  WITH CHECK (public.is_service_role() OR public.is_super_admin());

-- 7.3 user_travel_preferences
DROP POLICY IF EXISTS "user_travel_prefs_owner" ON public.user_travel_preferences;
CREATE POLICY "user_travel_prefs_owner" ON public.user_travel_preferences
  FOR ALL USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- 7.4 flight_bookings
DROP POLICY IF EXISTS "flight_bookings_select_scoped" ON public.flight_bookings;
DROP POLICY IF EXISTS "flight_bookings_insert_scoped" ON public.flight_bookings;
DROP POLICY IF EXISTS "flight_bookings_update_scoped" ON public.flight_bookings;

CREATE POLICY "flight_bookings_select_scoped" ON public.flight_bookings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR lower(COALESCE(passenger_email, '')) = lower(COALESCE(public.current_username(), ''))
      OR public.is_super_admin()
    )
  );

CREATE POLICY "flight_bookings_insert_scoped" ON public.flight_bookings
  FOR INSERT WITH CHECK (
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND char_length(trim(COALESCE(passenger_email, ''))) >= 3
    )
    OR (
      auth.uid() IS NOT NULL
      AND (user_id = auth.uid() OR public.is_super_admin())
    )
  );

CREATE POLICY "flight_bookings_update_scoped" ON public.flight_bookings
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_super_admin())
  );

-- 7.5 flight_price_alerts
DROP POLICY IF EXISTS "flight_price_alerts_owner" ON public.flight_price_alerts;
CREATE POLICY "flight_price_alerts_owner" ON public.flight_price_alerts
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR username = public.current_username()
      OR public.is_super_admin()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR username = public.current_username()
      OR public.is_super_admin()
    )
  );

-- 7.6 compliance_requests
DROP POLICY IF EXISTS "compliance_requests_select" ON public.compliance_requests;
DROP POLICY IF EXISTS "compliance_requests_insert" ON public.compliance_requests;
DROP POLICY IF EXISTS "compliance_requests_admin_update" ON public.compliance_requests;

CREATE POLICY "compliance_requests_select" ON public.compliance_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid()
      OR lower(requester_email) = lower(COALESCE(public.current_username(), ''))
      OR public.is_super_admin()
    )
  );

CREATE POLICY "compliance_requests_insert" ON public.compliance_requests
  FOR INSERT WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL AND char_length(trim(requester_email)) >= 3)
    OR (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR public.is_super_admin()))
  );

CREATE POLICY "compliance_requests_admin_update" ON public.compliance_requests
  FOR UPDATE USING (public.is_super_admin() OR public.is_service_role())
  WITH CHECK (public.is_super_admin() OR public.is_service_role());

-- ---------------------------------------------------------------------------------------
-- 8. GUEST-TO-AUTHENTICATED BOOKING CLAIM RPC (Cross-Platform Session Continuity)
-- ---------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_guest_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(COALESCE(auth.jwt() ->> 'email', ''));
  v_claimed integer := 0;
  v_rows integer := 0;
BEGIN
  IF v_uid IS NULL OR v_email = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.platform_bookings
  SET user_id = v_uid
  WHERE user_id IS NULL AND lower(customer_email) = v_email;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_claimed := v_claimed + v_rows;

  UPDATE public.stay_bookings
  SET guest_user_id = v_uid
  WHERE guest_user_id IS NULL AND lower(guest_email) = v_email;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_claimed := v_claimed + v_rows;

  UPDATE public.flight_bookings
  SET user_id = v_uid
  WHERE user_id IS NULL AND lower(COALESCE(passenger_email, '')) = v_email;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_claimed := v_claimed + v_rows;

  UPDATE public.payment_settlements
  SET user_id = v_uid
  WHERE user_id IS NULL AND lower(customer_email) = v_email;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_claimed := v_claimed + v_rows;

  UPDATE public.tour_requests
  SET requester_user_id = v_uid
  WHERE requester_user_id IS NULL AND lower(username) = v_email;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_claimed := v_claimed + v_rows;

  UPDATE public.compliance_requests
  SET user_id = v_uid
  WHERE user_id IS NULL AND lower(requester_email) = v_email;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_claimed := v_claimed + v_rows;

  RETURN v_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_bookings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_guest_bookings() TO authenticated;

-- ---------------------------------------------------------------------------------------
-- 9. STORAGE BUCKETS & POLICIES FIX (`ImageDropzoneUploader.tsx` + Avatars + KYC + Docs)
-- ---------------------------------------------------------------------------------------
-- Fixes folderPrefix mismatch: ImageDropzoneUploader writes to `properties/...`, `hotels/...`,
-- `transport/...`, `wellness/...`, and `listings/...`, as well as `<uid>/...`.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('property-media', 'property-media', true),
  ('service-images', 'service-images', true),
  ('avatars', 'avatars', true),
  ('kyc-documents', 'kyc-documents', false),
  ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "property_media_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "property_media_owner_write" ON storage.objects;
  DROP POLICY IF EXISTS "property_media_owner_update" ON storage.objects;
  DROP POLICY IF EXISTS "property_media_owner_delete" ON storage.objects;

  DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "service_images_owner_write" ON storage.objects;
  DROP POLICY IF EXISTS "service_images_owner_update" ON storage.objects;
  DROP POLICY IF EXISTS "service_images_owner_delete" ON storage.objects;

  DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
  DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
END
$$;

-- property-media
CREATE POLICY "property_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-media');

CREATE POLICY "property_media_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-media'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (auth.uid()::text, 'properties', 'hotels', 'listings')
  );

CREATE POLICY "property_media_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-media'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

CREATE POLICY "property_media_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-media'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- service-images
CREATE POLICY "service_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "service_images_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'service-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (auth.uid()::text, 'transport', 'wellness', 'accommodations', 'listings')
  );

CREATE POLICY "service_images_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'service-images'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

CREATE POLICY "service_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'service-images'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- avatars
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- ---------------------------------------------------------------------------------------
-- 10. REALTIME PUBLICATION SYNCHRONIZATION
-- ---------------------------------------------------------------------------------------
DO $$
DECLARE
  v_tables text[] := ARRAY[
    'properties',
    'notifications',
    'messages',
    'tour_requests',
    'stay_bookings',
    'platform_governance',
    'platform_bookings',
    'flight_bookings',
    'user_travel_preferences',
    'hotel_registrations',
    'hotel_rooms',
    'car_rentals',
    'wellness_services',
    'accommodation_services',
    'kyc_verifications'
  ];
  v_tbl text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH v_tbl IN ARRAY v_tables LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', v_tbl);
      END IF;
    END LOOP;
  END IF;
END
$$;

COMMIT;
