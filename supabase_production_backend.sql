-- =======================================================================================
-- AFRIESTATE — PRODUCTION SUPABASE POSTGRESQL, AUTH, RLS & STORAGE BACKEND
-- =======================================================================================
-- Execute this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query).
-- Safe to run on a fresh project or to upgrade/synchronize an existing AfriEstate schema.
-- =======================================================================================

BEGIN;

-- ---------------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------------------
-- 2. CUSTOM ENUM TYPES (Idempotent Creation)
-- ---------------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.role_type AS ENUM (
      'super_admin',
      'user',
      'agent',
      'investor',
      'hotel_manager',
      'transport',
      'wellness',
      'developer',
      'agency'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_type_enum' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.listing_type_enum AS ENUM ('All', 'For Rent', 'For Sale', 'For Investment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_enum' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.property_type_enum AS ENUM (
      'All Types',
      'Apartment',
      'House',
      'Commercial',
      'Student Housing',
      'Township Home',
      'Rural Property',
      'Land',
      'Luxury Estate',
      'In Construction',
      'Short-term Stay',
      'Hotel',
      'Transport Rental',
      'Wellness Retreat'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status_enum' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.property_status_enum AS ENUM ('Active', 'Draft', 'Pending Approval', 'Expired', 'Sold');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.service_status AS ENUM ('pending_review', 'active', 'suspended', 'archived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_transmission' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.vehicle_transmission AS ENUM ('auto', 'manual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status_enum' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.kyc_status_enum AS ENUM (
      'Not Started',
      'Pending Review',
      'Needs Manual Review',
      'Approved',
      'Rejected',
      'Flagged'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.booking_status_enum AS ENUM ('Confirmed', 'Pending', 'Cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status_enum' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.account_status_enum AS ENUM ('Active', 'Pending Verification', 'Restricted', 'Suspended');
  END IF;
END
$$;

-- Ensure any legacy enums accept all current AfriEstate values before committing Transaction 1
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'hotel_manager';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'transport';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'wellness';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.role_type ADD VALUE IF NOT EXISTS 'agency';

ALTER TYPE public.listing_type_enum ADD VALUE IF NOT EXISTS 'All';
ALTER TYPE public.listing_type_enum ADD VALUE IF NOT EXISTS 'For Rent';
ALTER TYPE public.listing_type_enum ADD VALUE IF NOT EXISTS 'For Sale';
ALTER TYPE public.listing_type_enum ADD VALUE IF NOT EXISTS 'For Investment';

ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'All Types';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Apartment';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'House';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Commercial';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Student Housing';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Township Home';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Rural Property';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Land';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Luxury Estate';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'In Construction';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Short-term Stay';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Hotel';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Transport Rental';
ALTER TYPE public.property_type_enum ADD VALUE IF NOT EXISTS 'Wellness Retreat';

ALTER TYPE public.property_status_enum ADD VALUE IF NOT EXISTS 'Active';
ALTER TYPE public.property_status_enum ADD VALUE IF NOT EXISTS 'Draft';
ALTER TYPE public.property_status_enum ADD VALUE IF NOT EXISTS 'Pending Approval';
ALTER TYPE public.property_status_enum ADD VALUE IF NOT EXISTS 'Expired';
ALTER TYPE public.property_status_enum ADD VALUE IF NOT EXISTS 'Sold';

ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE public.service_status ADD VALUE IF NOT EXISTS 'archived';

ALTER TYPE public.vehicle_transmission ADD VALUE IF NOT EXISTS 'auto';
ALTER TYPE public.vehicle_transmission ADD VALUE IF NOT EXISTS 'manual';

ALTER TYPE public.kyc_status_enum ADD VALUE IF NOT EXISTS 'Not Started';
ALTER TYPE public.kyc_status_enum ADD VALUE IF NOT EXISTS 'Pending Review';
ALTER TYPE public.kyc_status_enum ADD VALUE IF NOT EXISTS 'Needs Manual Review';
ALTER TYPE public.kyc_status_enum ADD VALUE IF NOT EXISTS 'Approved';
ALTER TYPE public.kyc_status_enum ADD VALUE IF NOT EXISTS 'Rejected';
ALTER TYPE public.kyc_status_enum ADD VALUE IF NOT EXISTS 'Flagged';

ALTER TYPE public.booking_status_enum ADD VALUE IF NOT EXISTS 'Confirmed';
ALTER TYPE public.booking_status_enum ADD VALUE IF NOT EXISTS 'Pending';
ALTER TYPE public.booking_status_enum ADD VALUE IF NOT EXISTS 'Cancelled';

ALTER TYPE public.account_status_enum ADD VALUE IF NOT EXISTS 'Active';
ALTER TYPE public.account_status_enum ADD VALUE IF NOT EXISTS 'Pending Verification';
ALTER TYPE public.account_status_enum ADD VALUE IF NOT EXISTS 'Restricted';
ALTER TYPE public.account_status_enum ADD VALUE IF NOT EXISTS 'Suspended';

-- Commit enum changes so newly added enum values are safe to reference in table defaults & policies
COMMIT;

BEGIN;

-- ---------------------------------------------------------------------------------------
-- 3. SHARED TRIGGER UTILITY FUNCTIONS
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

-- ---------------------------------------------------------------------------------------
-- 4. CORE TABLES (NO PLAINTEXT PASSWORDS ANYWHERE)
-- ---------------------------------------------------------------------------------------

-- 4.1 User Profiles (1-to-1 with auth.users; keyed by username for frontend compatibility + id UUID)
CREATE TABLE IF NOT EXISTS public.profiles (
  username text NOT NULL PRIMARY KEY,
  id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT 'AfriEstate Member',
  email text NOT NULL UNIQUE,
  role public.role_type NOT NULL DEFAULT 'user',
  phone text,
  office_address text,
  agency_name text,
  company_name text,
  business_reg_number text,
  agent_license text,
  investment_type text,
  location_preference text,
  budget_min numeric,
  budget_max numeric,
  profile_picture text,
  country text DEFAULT 'South Africa',
  preferred_currency text DEFAULT 'ZAR',
  has_2fa_enabled boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  kyc_status public.kyc_status_enum NOT NULL DEFAULT 'Not Started',
  status public.account_status_enum NOT NULL DEFAULT 'Active',
  is_wallet_frozen boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT true,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Upgrade existing profiles tables safely & drop insecure legacy plaintext password column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'South Africa';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'ZAR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_2fa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status public.kyc_status_enum NOT NULL DEFAULT 'Not Started';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status public.account_status_enum NOT NULL DEFAULT 'Active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_wallet_frozen boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_publish boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_note text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password;

-- 4.2 Agent Public Profiles
CREATE TABLE IF NOT EXISTS public.agent_profiles (
  username text NOT NULL PRIMARY KEY REFERENCES public.profiles(username) ON DELETE CASCADE,
  bio text,
  email text,
  phone text,
  profile_picture text,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  listings_count integer NOT NULL DEFAULT 0,
  sales_completed integer NOT NULL DEFAULT 0,
  active_since text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4.3 Sovereign KYC Verifications (FaceOnLive & Compliance Desk)
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE REFERENCES public.profiles(username) ON DELETE CASCADE,
  role public.role_type NOT NULL DEFAULT 'user',
  status public.kyc_status_enum NOT NULL DEFAULT 'Pending Review',
  provider text NOT NULL DEFAULT 'FaceOnLive Face Recognition SDK for Windows',
  repository_url text,
  face_match_score numeric(5, 4) CHECK (face_match_score IS NULL OR (face_match_score >= 0 AND face_match_score <= 1)),
  liveness_score numeric(5, 4) CHECK (liveness_score IS NULL OR (liveness_score >= 0 AND liveness_score <= 1)),
  provider_reference text,
  document_type text,
  document_storage_path text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS document_storage_path text;
ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.kyc_verifications ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.kyc_audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kyc_id uuid REFERENCES public.kyc_verifications(id) ON DELETE CASCADE,
  username text NOT NULL,
  event_type text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4.4 Marketplace Properties (Sales, Long-Term Rentals, Stays, Investments, Fleet, Wellness)
CREATE TABLE IF NOT EXISTS public.properties (
  id text NOT NULL PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  listing_type public.listing_type_enum NOT NULL DEFAULT 'For Sale',
  property_type public.property_type_enum NOT NULL DEFAULT 'House',
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  coordinates jsonb NOT NULL DEFAULT '{}'::jsonb,
  price numeric NOT NULL CHECK (price >= 0),
  purchase_price numeric CHECK (purchase_price IS NULL OR purchase_price >= 0),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text NOT NULL,
  neighborhood_info text,
  amenities text[] NOT NULL DEFAULT '{}'::text[],
  images text[] NOT NULL DEFAULT '{}'::text[],
  virtual_tour_url text,
  vr_tour_url text,
  agent_name text,
  agent jsonb NOT NULL DEFAULT '{}'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  smart_contract_ready boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  status public.property_status_enum NOT NULL DEFAULT 'Active',
  date_listed bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  saves integer NOT NULL DEFAULT 0 CHECK (saves >= 0),
  price_history jsonb[] NOT NULL DEFAULT '{}'::jsonb[],
  occupancy_rate numeric,
  market_roi numeric,
  financials jsonb[] NOT NULL DEFAULT '{}'::jsonb[],
  guests integer,
  vehicle_type text,
  package_includes text[] NOT NULL DEFAULT '{}'::text[],
  per_night_price boolean NOT NULL DEFAULT false,
  country text,
  region text,
  has_solar boolean NOT NULL DEFAULT false,
  has_generator boolean NOT NULL DEFAULT false,
  has_borehole boolean NOT NULL DEFAULT false,
  has_water_tank boolean NOT NULL DEFAULT false,
  has_fibre boolean NOT NULL DEFAULT false,
  security_features text[] NOT NULL DEFAULT '{}'::text[],
  proximity text[] NOT NULL DEFAULT '{}'::text[],
  lease_duration text,
  target_return numeric,
  rental_yield numeric,
  projected_roi numeric,
  min_investment numeric,
  investment_type text,
  risk_level text,
  local_currency text DEFAULT 'ZAR',
  foreign_buyer_eligible boolean DEFAULT true,
  verification_details jsonb,
  rating_average numeric(3, 2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_solar boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_generator boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_borehole boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_water_tank boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_fibre boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS security_features text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS proximity text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS lease_duration text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS target_return numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rental_yield numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS projected_roi numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS min_investment numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS investment_type text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS risk_level text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS local_currency text DEFAULT 'ZAR';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS foreign_buyer_eligible boolean DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_details jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rating_average numeric(3, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

-- 4.5 Saved Properties, Saved Searches & Alerts
CREATE TABLE IF NOT EXISTS public.saved_properties (
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  property_id text NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (username, property_id)
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  name text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.property_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  name text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4.6 Agent & Property Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  property_id text REFERENCES public.properties(id) ON DELETE SET NULL,
  reviewer_username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  timestamp bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS property_id text REFERENCES public.properties(id) ON DELETE SET NULL;

-- 4.7 Hotel Partner Registrations, Rooms & Stay Bookings
CREATE TABLE IF NOT EXISTS public.hotel_registrations (
  id text NOT NULL PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hotel_name text NOT NULL,
  hotel_type text NOT NULL DEFAULT 'Hotel',
  star_rating integer NOT NULL DEFAULT 5 CHECK (star_rating >= 1 AND star_rating <= 5),
  company_name text NOT NULL,
  trading_name text,
  business_email text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  province text,
  city text NOT NULL,
  district text,
  street text,
  postal text,
  base_currency text NOT NULL DEFAULT 'ZAR',
  check_in_time text NOT NULL DEFAULT '14:00',
  check_out_time text NOT NULL DEFAULT '11:00',
  cancellation_policy text NOT NULL DEFAULT 'Flexible',
  gallery_images text[] NOT NULL DEFAULT '{}'::text[],
  amenities text[] NOT NULL DEFAULT '{}'::text[],
  integrity_signature text,
  status public.service_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id text NOT NULL PRIMARY KEY,
  hotel_id text NOT NULL REFERENCES public.hotel_registrations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  bed_config text NOT NULL,
  max_adults integer NOT NULL DEFAULT 2 CHECK (max_adults >= 1),
  max_children integer NOT NULL DEFAULT 0 CHECK (max_children >= 0),
  size_sqm numeric NOT NULL DEFAULT 35,
  view_type text,
  available_count integer NOT NULL DEFAULT 1 CHECK (available_count >= 0),
  base_rate numeric NOT NULL CHECK (base_rate >= 0),
  amenities text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.stay_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref text NOT NULL UNIQUE,
  property_id text NOT NULL,
  property_name text NOT NULL,
  room_id text NOT NULL,
  room_name text NOT NULL,
  rate_plan_name text NOT NULL,
  term_mode text NOT NULL CHECK (term_mode IN ('short-term', 'long-term')),
  check_in text NOT NULL,
  check_out text NOT NULL,
  guests_label text NOT NULL,
  nights integer NOT NULL DEFAULT 1 CHECK (nights >= 0),
  months integer NOT NULL DEFAULT 0 CHECK (months >= 0),
  guest_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  pay_option text NOT NULL CHECK (pay_option IN ('now', 'property')),
  base_subtotal_zar numeric(14, 2) NOT NULL CHECK (base_subtotal_zar >= 0),
  taxes_zar numeric(14, 2) NOT NULL DEFAULT 0 CHECK (taxes_zar >= 0),
  service_fee_zar numeric(14, 2) NOT NULL DEFAULT 0 CHECK (service_fee_zar >= 0),
  grand_total_zar numeric(14, 2) NOT NULL CHECK (grand_total_zar >= 0),
  pay_today_zar numeric(14, 2) NOT NULL DEFAULT 0 CHECK (pay_today_zar >= 0),
  pay_at_property_zar numeric(14, 2) NOT NULL DEFAULT 0 CHECK (pay_at_property_zar >= 0),
  status public.booking_status_enum NOT NULL DEFAULT 'Confirmed',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4.8 Vertical Service Listings (Transport, Wellness, Direct Stays)
CREATE TABLE IF NOT EXISTS public.car_rentals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  business_name text NOT NULL,
  trading_name text,
  registration_number text,
  vat_number text,
  business_type text NOT NULL,
  contact_person text NOT NULL,
  mobile_number text NOT NULL,
  whatsapp_number text NOT NULL,
  email_address text NOT NULL,
  website text,
  country text NOT NULL,
  province text NOT NULL,
  city text NOT NULL,
  pickup_address text NOT NULL,
  vehicle_title text NOT NULL,
  vehicle_category text NOT NULL,
  vehicle_make_model text NOT NULL,
  vehicle_year integer NOT NULL CHECK (vehicle_year >= 1980 AND vehicle_year <= 2100),
  transmission public.vehicle_transmission NOT NULL DEFAULT 'auto',
  daily_rate numeric(12, 2) NOT NULL CHECK (daily_rate >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  description text NOT NULL,
  images text[] NOT NULL DEFAULT '{}'::text[],
  is_verified boolean NOT NULL DEFAULT false,
  status public.service_status NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.car_rentals ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.car_rentals ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.car_rentals ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.wellness_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  business_name text NOT NULL,
  trading_name text,
  registration_number text,
  wellness_category text NOT NULL,
  contact_person text NOT NULL,
  mobile_number text NOT NULL,
  whatsapp_number text NOT NULL,
  email_address text NOT NULL,
  website text,
  country text NOT NULL,
  province text,
  city text NOT NULL,
  physical_address text,
  session_price numeric(12, 2) DEFAULT 650,
  description text NOT NULL,
  images text[] NOT NULL DEFAULT '{}'::text[],
  is_verified boolean NOT NULL DEFAULT false,
  status public.service_status NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.wellness_services ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.wellness_services ADD COLUMN IF NOT EXISTS session_price numeric(12, 2) DEFAULT 650;
ALTER TABLE public.wellness_services ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.wellness_services ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.accommodation_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  accommodation_type text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  address text,
  nightly_rate numeric(12, 2) NOT NULL CHECK (nightly_rate >= 0),
  currency text NOT NULL DEFAULT 'ZAR',
  max_guests integer NOT NULL DEFAULT 2 CHECK (max_guests >= 1),
  description text NOT NULL,
  images text[] NOT NULL DEFAULT '{}'::text[],
  is_verified boolean NOT NULL DEFAULT false,
  status public.service_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4.9 Tour Requests, Messaging, Calendar & Notifications
CREATE TABLE IF NOT EXISTS public.tour_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id text NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_title text NOT NULL,
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  client_name text,
  client_email text,
  client_phone text,
  date text NOT NULL,
  time text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'Pending',
  timestamp bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id text REFERENCES public.properties(id) ON DELETE SET NULL,
  property_title text,
  sender_username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  receiver_username text NOT NULL,
  text text NOT NULL,
  timestamp bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  title text NOT NULL,
  date text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  description text,
  event_type text DEFAULT 'Property Showing',
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  property_id text REFERENCES public.properties(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'New Listing',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  timestamp bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4.10 Investor Desk & User Documents
CREATE TABLE IF NOT EXISTS public.investor_settings (
  username text NOT NULL PRIMARY KEY REFERENCES public.profiles(username) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.investment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  request_details text NOT NULL,
  assigned_agent_username text REFERENCES public.profiles(username) ON DELETE SET NULL,
  timestamp bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL REFERENCES public.profiles(username) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  upload_date bigint NOT NULL DEFAULT ((extract(epoch FROM now()) * 1000)::bigint),
  status text NOT NULL DEFAULT 'verified',
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4.11 Super Admin Sovereign Governance, Revenue Escrow & Compliance
CREATE TABLE IF NOT EXISTS public.platform_governance (
  id text NOT NULL PRIMARY KEY DEFAULT 'global',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  role_controls jsonb NOT NULL DEFAULT '{}'::jsonb,
  country_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  listing_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.country_configs (
  code text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL,
  currency text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  featured_hub boolean NOT NULL DEFAULT false,
  vat_rate_pct numeric(5, 2) NOT NULL DEFAULT 15.0,
  stamp_duty_pct numeric(5, 2) NOT NULL DEFAULT 2.0,
  target_rental_yield_pct numeric(5, 2) NOT NULL DEFAULT 9.0,
  monthly_revenue_target_zar numeric(14, 2) NOT NULL DEFAULT 250000,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.role_policies (
  role_key text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  can_login boolean NOT NULL DEFAULT true,
  can_publish_listings boolean NOT NULL DEFAULT true,
  can_access_investment_desk boolean NOT NULL DEFAULT false,
  requires_kyc_approval boolean NOT NULL DEFAULT false,
  max_active_listings integer NOT NULL DEFAULT 25,
  verification_badge_required boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.governance_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  action text NOT NULL,
  actor text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  booking_ref text,
  property_id text REFERENCES public.properties(id) ON DELETE SET NULL,
  payer_username text REFERENCES public.profiles(username) ON DELETE SET NULL,
  payee_username text,
  country text NOT NULL DEFAULT 'South Africa',
  currency text NOT NULL DEFAULT 'ZAR',
  gross_amount_zar numeric(14, 2) NOT NULL CHECK (gross_amount_zar >= 0),
  platform_fee_zar numeric(14, 2) NOT NULL DEFAULT 0 CHECK (platform_fee_zar >= 0),
  net_payout_zar numeric(14, 2) NOT NULL CHECK (net_payout_zar >= 0),
  status text NOT NULL DEFAULT 'Held in Escrow',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reporter_username text REFERENCES public.profiles(username) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  resolution_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ---------------------------------------------------------------------------------------
-- 5. SECURITY HELPER FUNCTIONS (AFTER TABLES EXIST)
-- ---------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    auth.jwt() -> 'app_metadata' ->> 'role',
    'user'
  );
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
    auth.jwt() ->> 'email'
  );
$$;

-- ---------------------------------------------------------------------------------------
-- 6. AUTHENTICATION, INTEGRITY & COUNTER TRIGGERS
-- ---------------------------------------------------------------------------------------

-- 6.1 Auto-create profile when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_username text;
  v_requested_role text;
  v_safe_role public.role_type;
  v_full_name text;
  v_is_verified boolean;
  v_kyc_status public.kyc_status_enum;
  v_account_status public.account_status_enum;
BEGIN
  v_email := lower(COALESCE(NEW.email, NEW.id::text || '@afriestate.local'));
  v_username := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'username'), ''), v_email);
  v_full_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(v_email, '@', 1));

  -- Privilege Escalation Protection: never accept 'super_admin' from user-mutable raw_user_meta_data.
  -- 'super_admin' may ONLY come from server-managed raw_app_meta_data.
  IF (NEW.raw_app_meta_data ->> 'role') = 'super_admin' THEN
    v_safe_role := 'super_admin';
  ELSE
    v_requested_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'user');
    IF v_requested_role IN ('user', 'agent', 'investor', 'hotel_manager', 'transport', 'wellness', 'developer', 'agency') THEN
      v_safe_role := v_requested_role::public.role_type;
    ELSE
      v_safe_role := 'user';
    END IF;
  END IF;

  v_is_verified := (v_safe_role IN ('user', 'super_admin'));
  v_kyc_status := CASE WHEN v_safe_role IN ('user', 'super_admin') THEN 'Not Started'::public.kyc_status_enum ELSE 'Pending Review'::public.kyc_status_enum END;
  v_account_status := CASE WHEN v_safe_role IN ('user', 'super_admin') THEN 'Active'::public.account_status_enum ELSE 'Pending Verification'::public.account_status_enum END;

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
    is_verified,
    kyc_status,
    status
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
    v_is_verified,
    v_kyc_status,
    v_account_status
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    updated_at = timezone('utc', now());

  IF v_safe_role IN ('agent', 'agency') THEN
    INSERT INTO public.agent_profiles (username, bio, email, phone, active_since)
    VALUES (
      v_username,
      'Accredited AfriEstate Property Advisor.',
      v_email,
      NEW.raw_user_meta_data ->> 'phone',
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

-- 6.2 Prevent self-escalation on public.profiles
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_service_role() OR public.is_super_admin()) THEN
    NEW.role := OLD.role;
    NEW.is_verified := OLD.is_verified;
    NEW.kyc_status := OLD.kyc_status;
    NEW.status := OLD.status;
    NEW.is_wallet_frozen := OLD.is_wallet_frozen;
    NEW.can_publish := OLD.can_publish;
    NEW.admin_note := OLD.admin_note;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- 6.3 Synchronize property save counters automatically
CREATE OR REPLACE FUNCTION public.sync_property_save_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop_id text;
BEGIN
  v_prop_id := COALESCE(NEW.property_id, OLD.property_id);
  UPDATE public.properties
  SET saves = (SELECT count(*)::integer FROM public.saved_properties WHERE property_id = v_prop_id)
  WHERE id = v_prop_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_saved_properties_counter ON public.saved_properties;
CREATE TRIGGER trg_saved_properties_counter
  AFTER INSERT OR DELETE ON public.saved_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_property_save_count();

-- 6.4 Synchronize property ratings summary automatically
CREATE OR REPLACE FUNCTION public.sync_property_rating_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prop_id text;
BEGIN
  v_prop_id := COALESCE(NEW.property_id, OLD.property_id);
  IF v_prop_id IS NOT NULL THEN
    UPDATE public.properties
    SET
      rating_count = (SELECT count(*)::integer FROM public.reviews WHERE property_id = v_prop_id),
      rating_average = COALESCE((SELECT round(avg(rating)::numeric, 2) FROM public.reviews WHERE property_id = v_prop_id), 0)
    WHERE id = v_prop_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_rating_summary ON public.reviews;
CREATE TRIGGER trg_reviews_rating_summary
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_property_rating_summary();

-- 6.5 Synchronize KYC status back to profiles
CREATE OR REPLACE FUNCTION public.sync_profile_kyc_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    kyc_status = NEW.status,
    is_verified = (NEW.status = 'Approved'),
    status = CASE
      WHEN NEW.status = 'Approved' AND status = 'Pending Verification' THEN 'Active'::public.account_status_enum
      WHEN NEW.status = 'Flagged' THEN 'Restricted'::public.account_status_enum
      ELSE status
    END
  WHERE username = NEW.username;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_kyc ON public.kyc_verifications;
CREATE TRIGGER trg_sync_profile_kyc
  AFTER INSERT OR UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_kyc_status();

-- 6.6 Standard updated_at triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_properties_updated_at ON public.properties;
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hotel_reg_updated_at ON public.hotel_registrations;
CREATE TRIGGER trg_hotel_reg_updated_at BEFORE UPDATE ON public.hotel_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hotel_rooms_updated_at ON public.hotel_rooms;
CREATE TRIGGER trg_hotel_rooms_updated_at BEFORE UPDATE ON public.hotel_rooms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_stay_bookings_updated_at ON public.stay_bookings;
CREATE TRIGGER trg_stay_bookings_updated_at BEFORE UPDATE ON public.stay_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_car_rentals_updated_at ON public.car_rentals;
CREATE TRIGGER trg_car_rentals_updated_at BEFORE UPDATE ON public.car_rentals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_wellness_updated_at ON public.wellness_services;
CREATE TRIGGER trg_wellness_updated_at BEFORE UPDATE ON public.wellness_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_accom_updated_at ON public.accommodation_services;
CREATE TRIGGER trg_accom_updated_at BEFORE UPDATE ON public.accommodation_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_escrow_updated_at ON public.escrow_transactions;
CREATE TRIGGER trg_escrow_updated_at BEFORE UPDATE ON public.escrow_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------------------
-- 7. PERFORMANCE & SEARCH INDEXES
-- ---------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_name ON public.properties(agent_name);
CREATE INDEX IF NOT EXISTS idx_properties_active_catalog ON public.properties(listing_type, property_type, country, price DESC) WHERE status = 'Active';
CREATE INDEX IF NOT EXISTS idx_properties_date_listed ON public.properties(date_listed DESC);
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON public.properties USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_reviews_agent_ts ON public.reviews(agent_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tour_requests_username ON public.tour_requests(username, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tour_requests_property_id ON public.tour_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_username, receiver_username, timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(username, is_read, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stay_bookings_email ON public.stay_bookings(guest_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stay_bookings_property ON public.stay_bookings(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel_id ON public.hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_car_rentals_city_status ON public.car_rentals(country, city, status);
CREATE INDEX IF NOT EXISTS idx_wellness_city_status ON public.wellness_services(country, city, status);
CREATE INDEX IF NOT EXISTS idx_escrow_country_status ON public.escrow_transactions(country, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.governance_audit_logs(created_at DESC);

-- ---------------------------------------------------------------------------------------
-- 8. SECURE RPC FUNCTIONS
-- ---------------------------------------------------------------------------------------

-- 8.1 Increment view counter safely (called from lib/data.ts)
CREATE OR REPLACE FUNCTION public.increment_views(prop_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET views = views + 1
  WHERE id = prop_id AND status = 'Active';
END;
$$;

-- 8.2 Super Admin listing moderation RPC
CREATE OR REPLACE FUNCTION public.review_property_listing(
  p_property_id text,
  p_status public.property_status_enum,
  p_verified boolean DEFAULT NULL,
  p_featured boolean DEFAULT NULL
)
RETURNS public.properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.properties;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Forbidden: Super Admin clearance required.';
  END IF;

  UPDATE public.properties
  SET
    status = p_status,
    verified = COALESCE(p_verified, verified),
    featured = COALESCE(p_featured, featured)
  WHERE id = p_property_id
  RETURNING * INTO v_row;

  INSERT INTO public.governance_audit_logs (category, action, actor, actor_id, metadata)
  VALUES (
    'Listing Moderation',
    format('Set property %s to status=%s', p_property_id, p_status::text),
    COALESCE(public.current_username(), 'super_admin'),
    auth.uid(),
    jsonb_build_object('property_id', p_property_id, 'status', p_status, 'verified', p_verified, 'featured', p_featured)
  );

  RETURN v_row;
END;
$$;

-- 8.3 Super Admin vertical service moderation RPC
CREATE OR REPLACE FUNCTION public.review_service_listing(
  p_table text,
  p_id uuid,
  p_status public.service_status,
  p_verified boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_super_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Forbidden: Super Admin clearance required.';
  END IF;

  IF p_table = 'car_rentals' THEN
    UPDATE public.car_rentals SET status = p_status, is_verified = COALESCE(p_verified, is_verified) WHERE id = p_id;
  ELSIF p_table = 'wellness_services' THEN
    UPDATE public.wellness_services SET status = p_status, is_verified = COALESCE(p_verified, is_verified) WHERE id = p_id;
  ELSIF p_table = 'accommodation_services' THEN
    UPDATE public.accommodation_services SET status = p_status, is_verified = COALESCE(p_verified, is_verified) WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Unsupported service table: %', p_table;
  END IF;
END;
$$;

-- 8.4 User self-submission of KYC document
CREATE OR REPLACE FUNCTION public.submit_kyc_verification(
  p_document_type text,
  p_document_storage_path text DEFAULT NULL
)
RETURNS public.kyc_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_username text := public.current_username();
  v_role public.role_type;
  v_row public.kyc_verifications;
BEGIN
  IF v_user_id IS NULL OR v_username IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;

  INSERT INTO public.kyc_verifications (
    user_id, username, role, status, document_type, document_storage_path
  ) VALUES (
    v_user_id, v_username, COALESCE(v_role, 'user'::public.role_type), 'Pending Review', p_document_type, p_document_storage_path
  )
  ON CONFLICT (username) DO UPDATE SET
    status = 'Pending Review',
    document_type = EXCLUDED.document_type,
    document_storage_path = COALESCE(EXCLUDED.document_storage_path, public.kyc_verifications.document_storage_path),
    rejection_reason = NULL,
    updated_at = timezone('utc', now())
  RETURNING * INTO v_row;

  INSERT INTO public.kyc_audit_events (kyc_id, username, event_type, actor_id, details)
  VALUES (v_row.id, v_username, 'submitted', v_user_id, jsonb_build_object('document_type', p_document_type));

  RETURN v_row;
END;
$$;

-- 8.5 Sovereign / FaceOnLive KYC decision update RPC
CREATE OR REPLACE FUNCTION public.faceonlive_update_kyc_result(
  p_username text,
  p_match_score numeric,
  p_liveness_score numeric,
  p_provider_reference text DEFAULT NULL,
  p_rejection_reason text DEFAULT NULL
)
RETURNS public.kyc_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.kyc_status_enum;
  v_row public.kyc_verifications;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Forbidden: Admin or biometric service role required.';
  END IF;

  IF p_rejection_reason IS NOT NULL AND length(trim(p_rejection_reason)) > 0 THEN
    v_status := 'Rejected';
  ELSIF COALESCE(p_match_score, 0) >= 0.82 AND COALESCE(p_liveness_score, 0) >= 0.82 THEN
    v_status := 'Approved';
  ELSE
    v_status := 'Needs Manual Review';
  END IF;

  UPDATE public.kyc_verifications
  SET
    status = v_status,
    face_match_score = p_match_score,
    liveness_score = p_liveness_score,
    provider_reference = COALESCE(p_provider_reference, provider_reference),
    rejection_reason = p_rejection_reason,
    updated_at = timezone('utc', now())
  WHERE username = p_username
  RETURNING * INTO v_row;

  IF v_row.id IS NOT NULL THEN
    INSERT INTO public.kyc_audit_events (kyc_id, username, event_type, actor_id, details)
    VALUES (
      v_row.id,
      p_username,
      'biometric_decision',
      auth.uid(),
      jsonb_build_object('status', v_status, 'match_score', p_match_score, 'liveness_score', p_liveness_score)
    );
  END IF;

  RETURN v_row;
END;
$$;

-- 8.6 Super Admin user governance mutation RPC
CREATE OR REPLACE FUNCTION public.admin_update_user_governance(
  p_username text,
  p_role public.role_type DEFAULT NULL,
  p_status public.account_status_enum DEFAULT NULL,
  p_kyc_status public.kyc_status_enum DEFAULT NULL,
  p_is_wallet_frozen boolean DEFAULT NULL,
  p_can_publish boolean DEFAULT NULL,
  p_admin_note text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Forbidden: Super Admin clearance required.';
  END IF;

  UPDATE public.profiles
  SET
    role = COALESCE(p_role, role),
    status = COALESCE(p_status, status),
    kyc_status = COALESCE(p_kyc_status, kyc_status),
    is_verified = CASE WHEN p_kyc_status = 'Approved' THEN true WHEN p_kyc_status IN ('Rejected', 'Flagged') THEN false ELSE is_verified END,
    is_wallet_frozen = COALESCE(p_is_wallet_frozen, is_wallet_frozen),
    can_publish = COALESCE(p_can_publish, can_publish),
    admin_note = COALESCE(p_admin_note, admin_note)
  WHERE username = p_username OR email = p_username
  RETURNING * INTO v_row;

  INSERT INTO public.governance_audit_logs (category, action, actor, actor_id, metadata)
  VALUES (
    'User Governance',
    format('Updated governance controls for %s', p_username),
    COALESCE(public.current_username(), 'super_admin'),
    auth.uid(),
    jsonb_build_object('target', p_username, 'role', p_role, 'status', p_status, 'kyc_status', p_kyc_status, 'wallet_frozen', p_is_wallet_frozen)
  );

  RETURN v_row;
END;
$$;

-- 8.7 Super Admin investment lead assignment RPC
CREATE OR REPLACE FUNCTION public.admin_assign_investment_agent(
  p_request_id uuid,
  p_agent_username text
)
RETURNS public.investment_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.investment_requests;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Forbidden: Super Admin clearance required.';
  END IF;

  UPDATE public.investment_requests
  SET assigned_agent_username = p_agent_username, status = 'Contacted'
  WHERE id = p_request_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_views(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_views(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.review_property_listing(text, public.property_status_enum, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_property_listing(text, public.property_status_enum, boolean, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.review_service_listing(text, uuid, public.service_status, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_service_listing(text, uuid, public.service_status, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_kyc_verification(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_kyc_verification(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.faceonlive_update_kyc_result(text, numeric, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.faceonlive_update_kyc_result(text, numeric, numeric, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_update_user_governance(text, public.role_type, public.account_status_enum, public.kyc_status_enum, boolean, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_governance(text, public.role_type, public.account_status_enum, public.kyc_status_enum, boolean, boolean, text) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_assign_investment_agent(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_assign_investment_agent(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------------------
-- 9. STRICT ROW LEVEL SECURITY (RLS) POLICIES ON ALL TABLES
-- ---------------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stay_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- Drop old permissive or stale policies cleanly if upgrading
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- 9.1 profiles: Users read/update own profile; Super Admin manages all; never allow open enumeration of private fields
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR username = public.current_username() OR public.is_super_admin());
CREATE POLICY "profiles_insert_self_or_admin" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());
CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE USING (public.is_super_admin());

-- 9.2 agent_profiles: Public directory visibility, owner/admin write
CREATE POLICY "agent_profiles_select_public" ON public.agent_profiles
  FOR SELECT USING (true);
CREATE POLICY "agent_profiles_write_owner_or_admin" ON public.agent_profiles
  FOR ALL USING (username = public.current_username() OR public.is_super_admin())
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

-- 9.3 kyc_verifications & kyc_audit_events: Strict owner + Super Admin access
CREATE POLICY "kyc_select_owner_or_admin" ON public.kyc_verifications
  FOR SELECT USING (user_id = auth.uid() OR username = public.current_username() OR public.is_super_admin());
CREATE POLICY "kyc_insert_owner_or_admin" ON public.kyc_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid() OR username = public.current_username() OR public.is_super_admin());
CREATE POLICY "kyc_update_admin_only" ON public.kyc_verifications
  FOR UPDATE USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
CREATE POLICY "kyc_delete_admin_only" ON public.kyc_verifications
  FOR DELETE USING (public.is_super_admin());

CREATE POLICY "kyc_audit_admin_or_owner_select" ON public.kyc_audit_events
  FOR SELECT USING (username = public.current_username() OR public.is_super_admin());
CREATE POLICY "kyc_audit_admin_insert" ON public.kyc_audit_events
  FOR INSERT WITH CHECK (actor_id = auth.uid() OR public.is_super_admin());

-- 9.4 properties: Public reads Active listings; owners & Super Admin manage own/all listings
CREATE POLICY "properties_select_active_or_owner" ON public.properties
  FOR SELECT USING (
    status = 'Active'
    OR owner_id = auth.uid()
    OR agent_name = public.current_username()
    OR public.is_super_admin()
  );
CREATE POLICY "properties_insert_authenticated_owner" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (owner_id IS NULL OR owner_id = auth.uid() OR public.is_super_admin())
  );
CREATE POLICY "properties_update_owner_or_admin" ON public.properties
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR agent_name = public.current_username()
    OR public.is_super_admin()
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR agent_name = public.current_username()
    OR public.is_super_admin()
  );
CREATE POLICY "properties_delete_owner_or_admin" ON public.properties
  FOR DELETE USING (
    owner_id = auth.uid()
    OR agent_name = public.current_username()
    OR public.is_super_admin()
  );

-- 9.5 saved_properties, saved_searches, property_alerts: Strictly scoped to authenticated user
CREATE POLICY "saved_properties_owner" ON public.saved_properties
  FOR ALL USING (username = public.current_username() OR public.is_super_admin())
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

CREATE POLICY "saved_searches_owner" ON public.saved_searches
  FOR ALL USING (username = public.current_username() OR public.is_super_admin())
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

CREATE POLICY "property_alerts_owner" ON public.property_alerts
  FOR ALL USING (username = public.current_username() OR public.is_super_admin())
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

-- 9.6 reviews: Public readable, authenticated reviewer insert/update own, admin delete
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "reviews_insert_authenticated" ON public.reviews
  FOR INSERT WITH CHECK (reviewer_username = public.current_username() OR public.is_super_admin());
CREATE POLICY "reviews_update_owner_or_admin" ON public.reviews
  FOR UPDATE USING (reviewer_username = public.current_username() OR public.is_super_admin())
  WITH CHECK (reviewer_username = public.current_username() OR public.is_super_admin());
CREATE POLICY "reviews_delete_owner_or_admin" ON public.reviews
  FOR DELETE USING (reviewer_username = public.current_username() OR public.is_super_admin());

-- 9.7 hotel_registrations & hotel_rooms: Public reads active hotels/rooms; owners & Super Admin write
CREATE POLICY "hotels_select_active_or_owner" ON public.hotel_registrations
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "hotels_insert_authenticated" ON public.hotel_registrations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (owner_id IS NULL OR owner_id = auth.uid() OR public.is_super_admin()));
CREATE POLICY "hotels_update_owner_or_admin" ON public.hotel_registrations
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "hotels_delete_admin_or_owner" ON public.hotel_registrations
  FOR DELETE USING (owner_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "hotel_rooms_select_public" ON public.hotel_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hotel_registrations h
      WHERE h.id = hotel_id AND (h.status = 'active' OR h.owner_id = auth.uid() OR public.is_super_admin())
    )
  );
CREATE POLICY "hotel_rooms_write_owner_or_admin" ON public.hotel_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hotel_registrations h
      WHERE h.id = hotel_id AND (h.owner_id = auth.uid() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotel_registrations h
      WHERE h.id = hotel_id AND (h.owner_id = auth.uid() OR public.is_super_admin())
    )
  );

-- 9.8 stay_bookings: Guests view own bookings, hotel/property owners view property bookings, Super Admin views all
CREATE POLICY "stay_bookings_select_scoped" ON public.stay_bookings
  FOR SELECT USING (
    guest_user_id = auth.uid()
    OR guest_email = public.current_username()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_name = public.current_username())
    )
    OR public.is_super_admin()
  );
CREATE POLICY "stay_bookings_insert_guest_or_auth" ON public.stay_bookings
  FOR INSERT WITH CHECK (
    guest_user_id IS NULL OR guest_user_id = auth.uid() OR public.is_super_admin()
  );
CREATE POLICY "stay_bookings_update_owner_or_admin" ON public.stay_bookings
  FOR UPDATE USING (
    guest_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_name = public.current_username())
    )
    OR public.is_super_admin()
  );

-- 9.9 car_rentals, wellness_services, accommodation_services
CREATE POLICY "car_rentals_select" ON public.car_rentals
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin());
CREATE POLICY "car_rentals_insert" ON public.car_rentals
  FOR INSERT WITH CHECK (user_id = public.current_username() OR owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "car_rentals_update" ON public.car_rentals
  FOR UPDATE USING (owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin());
CREATE POLICY "car_rentals_delete" ON public.car_rentals
  FOR DELETE USING (owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin());

CREATE POLICY "wellness_select" ON public.wellness_services
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin());
CREATE POLICY "wellness_insert" ON public.wellness_services
  FOR INSERT WITH CHECK (user_id = public.current_username() OR owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "wellness_update" ON public.wellness_services
  FOR UPDATE USING (owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin());
CREATE POLICY "wellness_delete" ON public.wellness_services
  FOR DELETE USING (owner_id = auth.uid() OR user_id = public.current_username() OR public.is_super_admin());

CREATE POLICY "accommodation_select" ON public.accommodation_services
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "accommodation_write" ON public.accommodation_services
  FOR ALL USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());

-- 9.10 tour_requests, messages, calendar_events, notifications
CREATE POLICY "tour_requests_scoped" ON public.tour_requests
  FOR ALL USING (
    username = public.current_username()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND (p.owner_id = auth.uid() OR p.agent_name = public.current_username())
    )
    OR public.is_super_admin()
  )
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

CREATE POLICY "messages_participants_only" ON public.messages
  FOR SELECT USING (
    sender_username = public.current_username()
    OR receiver_username = public.current_username()
    OR public.is_super_admin()
  );
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (sender_username = public.current_username() OR public.is_super_admin());
CREATE POLICY "messages_update_recipient" ON public.messages
  FOR UPDATE USING (receiver_username = public.current_username() OR public.is_super_admin());

CREATE POLICY "calendar_events_owner" ON public.calendar_events
  FOR ALL USING (username = public.current_username() OR public.is_super_admin())
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

CREATE POLICY "notifications_owner" ON public.notifications
  FOR SELECT USING (username = public.current_username() OR public.is_super_admin());
CREATE POLICY "notifications_insert_auth_or_admin" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR public.is_super_admin());
CREATE POLICY "notifications_update_owner" ON public.notifications
  FOR UPDATE USING (username = public.current_username() OR public.is_super_admin());

-- 9.11 investor_settings, investment_requests, user_documents
CREATE POLICY "investor_settings_owner" ON public.investor_settings
  FOR ALL USING (username = public.current_username() OR public.is_super_admin())
  WITH CHECK (username = public.current_username() OR public.is_super_admin());

CREATE POLICY "investment_requests_scoped" ON public.investment_requests
  FOR SELECT USING (
    investor_username = public.current_username()
    OR assigned_agent_username = public.current_username()
    OR public.current_app_role() IN ('agent', 'agency', 'super_admin')
  );
CREATE POLICY "investment_requests_insert_investor" ON public.investment_requests
  FOR INSERT WITH CHECK (investor_username = public.current_username() OR public.is_super_admin());
CREATE POLICY "investment_requests_update_admin_or_assigned" ON public.investment_requests
  FOR UPDATE USING (assigned_agent_username = public.current_username() OR public.is_super_admin());

CREATE POLICY "user_documents_owner_or_admin" ON public.user_documents
  FOR ALL USING (owner_id = auth.uid() OR username = public.current_username() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR username = public.current_username() OR public.is_super_admin());

-- 9.12 Platform Governance, Country Configs, Role Policies, Audit Logs, Escrow & Moderation
CREATE POLICY "governance_read_all" ON public.platform_governance FOR SELECT USING (true);
CREATE POLICY "governance_admin_write" ON public.platform_governance
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "country_configs_read_all" ON public.country_configs FOR SELECT USING (true);
CREATE POLICY "country_configs_admin_write" ON public.country_configs
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "role_policies_read_all" ON public.role_policies FOR SELECT USING (true);
CREATE POLICY "role_policies_admin_write" ON public.role_policies
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "audit_logs_admin_only" ON public.governance_audit_logs
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "escrow_scoped_select" ON public.escrow_transactions
  FOR SELECT USING (
    payer_username = public.current_username()
    OR payee_username = public.current_username()
    OR public.is_super_admin()
  );
CREATE POLICY "escrow_admin_write" ON public.escrow_transactions
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY "moderation_reports_select" ON public.moderation_reports
  FOR SELECT USING (reporter_username = public.current_username() OR public.is_super_admin());
CREATE POLICY "moderation_reports_insert" ON public.moderation_reports
  FOR INSERT WITH CHECK (reporter_username = public.current_username() OR public.is_super_admin());
CREATE POLICY "moderation_reports_admin_update" ON public.moderation_reports
  FOR UPDATE USING (public.is_super_admin());

-- ---------------------------------------------------------------------------------------
-- 10. SUPABASE STORAGE BUCKETS & ACCESS POLICIES
-- ---------------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('property-media', 'property-media', true),
  ('service-images', 'service-images', true),
  ('kyc-documents', 'kyc-documents', false),
  ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "property_media_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "property_media_owner_write" ON storage.objects;
  DROP POLICY IF EXISTS "service_images_public_read" ON storage.objects;
  DROP POLICY IF EXISTS "service_images_owner_write" ON storage.objects;
  DROP POLICY IF EXISTS "kyc_docs_private_access" ON storage.objects;
  DROP POLICY IF EXISTS "user_docs_private_access" ON storage.objects;
END
$$;

CREATE POLICY "property_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-media');
CREATE POLICY "property_media_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-media' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "service_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-images');
CREATE POLICY "service_images_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'service-images' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "kyc_docs_private_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'kyc-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  )
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

CREATE POLICY "user_docs_private_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  )
  WITH CHECK (
    bucket_id = 'user-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_super_admin())
  );

-- ---------------------------------------------------------------------------------------
-- 11. REALTIME PUBLICATION
-- ---------------------------------------------------------------------------------------
DO $$
DECLARE
  v_tables text[] := ARRAY['properties', 'notifications', 'messages', 'tour_requests', 'stay_bookings', 'platform_governance'];
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

-- ---------------------------------------------------------------------------------------
-- 12. IDEMPOTENT PRODUCTION SEED DATA (COUNTRIES, ROLES, GLOBAL GOVERNANCE)
-- ---------------------------------------------------------------------------------------
INSERT INTO public.country_configs (code, name, region, currency, enabled, featured_hub, vat_rate_pct, stamp_duty_pct, target_rental_yield_pct, monthly_revenue_target_zar)
VALUES
  ('ZA', 'South Africa', 'Southern Africa', 'ZAR', true, true, 15.0, 3.0, 8.8, 1850000),
  ('KE', 'Kenya', 'East Africa', 'KES', true, true, 16.0, 4.0, 10.2, 920000),
  ('NG', 'Nigeria', 'West Africa', 'NGN', true, true, 7.5, 1.5, 11.4, 1140000),
  ('GH', 'Ghana', 'West Africa', 'GHS', true, false, 15.0, 1.0, 9.8, 540000),
  ('RW', 'Rwanda', 'East Africa', 'RWF', true, true, 18.0, 2.0, 10.6, 480000),
  ('MA', 'Morocco', 'North Africa', 'MAD', true, false, 20.0, 4.0, 8.5, 690000),
  ('EG', 'Egypt', 'North Africa', 'EGP', true, false, 14.0, 2.5, 10.9, 610000),
  ('AO', 'Angola', 'Central Africa', 'AOA', true, false, 14.0, 2.0, 11.2, 520000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_policies (role_key, label, can_login, can_publish_listings, can_access_investment_desk, requires_kyc_approval, max_active_listings, verification_badge_required)
VALUES
  ('user', 'Property Seeker & Host', true, true, false, false, 5, false),
  ('agent', 'Real Estate Agent', true, true, false, false, 100, true),
  ('investor', 'Investor', true, true, true, false, 25, true),
  ('hotel_manager', 'Hotel Partner & Manager', true, true, false, false, 250, true),
  ('transport', 'Transport Fleet Operator', true, true, false, false, 60, true),
  ('wellness', 'Wellness Sanctuary Partner', true, true, false, false, 40, true),
  ('developer', 'Property Developer', true, true, true, true, 300, true),
  ('agency', 'Estate Agency', true, true, true, true, 500, true)
ON CONFLICT (role_key) DO NOTHING;

INSERT INTO public.platform_governance (id, settings, role_controls, country_configs)
VALUES (
  'global',
  '{
    "siteName": "AfriEstate",
    "tagline": "Real Estate for Real People",
    "maintenanceMode": false,
    "defaultCurrency": "ZAR",
    "defaultLanguage": "en",
    "commissionRates": {
      "shortStayPercent": 7,
      "longTermPlacementPercent": 2.5,
      "salesBoostZar": 299,
      "propertyManagerMonthlyZar": 199,
      "hotelCommissionPercent": 5
    },
    "featureFlags": {
      "shortStays": true,
      "longTerm": true,
      "transport": true,
      "wellness": true,
      "neighborhoods": true,
      "professionals": true,
      "hotelRegistration": true,
      "aiConcierge": true,
      "aiValuation": true
    },
    "securityPolicies": {
      "requireKycToPublish": false,
      "autoModerateListings": true,
      "strictTitleDeedVerification": true,
      "sessionTimeoutMinutes": 15,
      "autoThrottleCooldownSeconds": 15,
      "aiModel": "gemini-4-hydrogen"
    }
  }'::jsonb,
  '{
    "user": {"roleKey":"user","label":"Property Seeker & Host","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":false,"requiresKycApproval":false,"maxActiveListings":5,"verificationBadgeRequired":false},
    "agent": {"roleKey":"agent","label":"Real Estate Agent","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":false,"requiresKycApproval":false,"maxActiveListings":100,"verificationBadgeRequired":true},
    "investor": {"roleKey":"investor","label":"Investor","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":true,"requiresKycApproval":false,"maxActiveListings":25,"verificationBadgeRequired":true},
    "hotel_manager": {"roleKey":"hotel_manager","label":"Hotel Partner & Manager","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":false,"requiresKycApproval":false,"maxActiveListings":250,"verificationBadgeRequired":true},
    "transport": {"roleKey":"transport","label":"Transport Fleet Operator","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":false,"requiresKycApproval":false,"maxActiveListings":60,"verificationBadgeRequired":true},
    "wellness": {"roleKey":"wellness","label":"Wellness Sanctuary Partner","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":false,"requiresKycApproval":false,"maxActiveListings":40,"verificationBadgeRequired":true},
    "developer": {"roleKey":"developer","label":"Property Developer","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":true,"requiresKycApproval":true,"maxActiveListings":300,"verificationBadgeRequired":true},
    "agency": {"roleKey":"agency","label":"Estate Agency","canLogin":true,"canPublishListings":true,"canAccessInvestmentDesk":true,"requiresKycApproval":true,"maxActiveListings":500,"verificationBadgeRequired":true}
  }'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- =======================================================================================
-- SUPER ADMIN PROVISIONING NOTE (Run separately via Supabase Auth / Service Role):
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
--   WHERE email = 'admin@yourdomain.com';
--   UPDATE public.profiles SET role = 'super_admin', is_verified = true WHERE email = 'admin@yourdomain.com';
-- =======================================================================================

COMMIT;
