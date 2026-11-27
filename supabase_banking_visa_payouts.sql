-- =============================================================================
-- AfriEstate Banking & Visa Direct Payout Accounts Migration
-- Run this idempotent script in Supabase SQL Editor to persist connected
-- masked banking details and Visa Direct payout destinations per user.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payout_bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  account_holder_name text NOT NULL,
  bank_name text NOT NULL,
  country text NOT NULL DEFAULT 'South Africa',
  settlement_currency text NOT NULL DEFAULT 'ZAR',
  payout_rail text NOT NULL CHECK (payout_rail IN ('local_eft_visa', 'bank_iban_visa', 'visa_direct_card')),
  account_last4 text NOT NULL CHECK (char_length(account_last4) = 4),
  iban_masked text,
  swift_bic text,
  routing_code_masked text,
  visa_card_brand text NOT NULL DEFAULT 'Visa Direct Supported',
  visa_direct_supported boolean NOT NULL DEFAULT true,
  verification_ref text,
  verification_status text NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Pending', 'Verified', 'Paused')),
  is_default boolean NOT NULL DEFAULT false,
  accepted_categories text[] NOT NULL DEFAULT ARRAY['short-stay', 'car-hire', 'commissions']::text[],
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payout_bank_accounts_user
  ON public.payout_bank_accounts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payout_bank_accounts_username
  ON public.payout_bank_accounts(lower(username), created_at DESC);

ALTER TABLE public.payout_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_bank_accounts_select_own" ON public.payout_bank_accounts;
CREATE POLICY "payout_bank_accounts_select_own"
  ON public.payout_bank_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payout_bank_accounts_insert_own" ON public.payout_bank_accounts;
CREATE POLICY "payout_bank_accounts_insert_own"
  ON public.payout_bank_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payout_bank_accounts_update_own" ON public.payout_bank_accounts;
CREATE POLICY "payout_bank_accounts_update_own"
  ON public.payout_bank_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payout_bank_accounts_delete_own" ON public.payout_bank_accounts;
CREATE POLICY "payout_bank_accounts_delete_own"
  ON public.payout_bank_accounts
  FOR DELETE
  USING (auth.uid() = user_id);
