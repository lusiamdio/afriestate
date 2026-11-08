# AfriEstate Platform Diagnostic and Unified Ecosystem Architecture

## Executive summary

AfriEstate is currently a React/Vite frontend backed by Supabase tables and several prototype/local fallback flows. It already has useful foundations: a central `properties` table, real-time subscriptions for `properties`, `notifications`, `messages`, and `tour_requests`, role-specific dashboards for users, agents, investors, and super admins, KYC SQL, and service-listing SQL for car rentals and wellness. However, it is not yet a fully unified transaction ecosystem. The largest gaps are data ownership, role coverage, write granularity, audit logging, service/accommodation unification, booking/payment/settlement infrastructure, and a real ledger-backed Agent-only Wallet.

The required target state is **one AfriEstate ecosystem**:

```text
One actor writes an authorised change
        ↓
Validation + policy enforcement
        ↓
Central source-of-truth tables
        ↓
Immutable audit/event records
        ↓
Realtime fan-out / projections / search index refresh
        ↓
Role-specific views: public marketplace, investor marketplace, services directory, accommodation pages, admin control centre
```

This document is the implementation blueprint for turning the existing app into a connected, scalable multi-sided real-estate marketplace and transaction system.

---

## 1. Current-state architecture assessment

### 1.1 Frontend architecture

Current stack:

- React 19 + Vite.
- Supabase client used directly from the frontend.
- Global app state in `App.tsx` with role branching, listing arrays, modal state, and real-time subscriptions.
- Role-specific dashboard components under `components/dashboards/**`.
- Prototype pages for rentals, wellness, short stays, services, pricing, about, contact, and marketplace.
- Demo fallback behavior in `lib/data.ts` when tables/network are unavailable.

Strengths:

- There is already a single `allProperties` state used by public, agent, and investor views.
- The frontend subscribes to `public:properties` and refetches central properties after database changes.
- Agents edit listings through a shared property form and agent listing management is filtered from the shared property collection.
- Investor opportunities are derived from `listingType === For Investment`, which is closer to a projection than a duplicate dataset.

Problems:

- `App.tsx` has too many responsibilities: routing, auth state, marketplace data, subscriptions, dashboard state, listing persistence, notifications, admin action handling, and modal orchestration.
- Listing writes are bulk upserts of the entire property array through `saveProperties(properties)`. This increases race-condition risk and can re-save stale listings.
- Deleting a listing is currently implemented as removing it from the frontend array and upserting the remaining list. Because upsert does not delete missing rows, this is not a reliable central delete operation.
- Admin actions update local state and toasts, but some actions do not persist authoritative status changes back to the database.
- Normal-user service listing and accommodation/short-stay marketplace flows are not modelled as first-class entities in one taxonomy.
- Some dashboards include simulated or synthetic financial/security data rather than ledger-backed records.

### 1.2 Backend/data architecture

Current backend assets:

- `supabase_complete_schema.sql` creates core tables: `profiles`, `properties`, `agent_profiles`, `reviews`, saved properties/searches, `tour_requests`, `messages`, `calendar_events`, `notifications`, `investor_settings`, `investment_requests`, and `user_documents`.
- `supabase_services_schema.sql` creates `car_rentals` and `wellness_services` separately.
- `supabase_kyc_backend.sql` adds KYC verification/audit tables and stricter service-role provider ingestion.
- `supabase_production_hardening.sql` contains policy hardening ideas, helper functions, and some additional tables/policies.

Strengths:

- Supabase is suitable for the requested central source of truth, row-level security, realtime subscriptions, storage, and RPCs.
- The central `properties` table already acts as a single listing source for residential, investment, hotel, short-term, transport, and wellness property types.
- KYC is partly separated from browser logic and has an audit table.

Problems:

- `profiles.role` currently supports `super_admin`, `agent`, `client`, and `investor` in SQL, while TypeScript supports only `user`, `agent`, and `investor`. Required roles such as property owner, service provider, accommodation provider, and administrator are not consistently represented.
- `properties` stores important ownership and lifecycle data as loose fields: `agent_name`, JSON blobs, arrays, and status. It lacks explicit `owner_user_id`, `created_by`, `updated_by`, `moderation_status`, `published_at`, `deleted_at`, and versioning.
- Service listings are isolated in `car_rentals` and `wellness_services`, which violates the requested service-directory architecture for all property-related services.
- There is no payment table set, no wallet ledger, no settlement table, no payout table, no refunds/disputes/chargebacks table, and no reconciliation table.
- Audit logging is incomplete for listing lifecycle changes and financial movements.
- Some policies are too broad or incomplete for the final role model.

### 1.3 Functional assessment

| Area | Current state | Required change |
|---|---|---|
| Property listings | Central `properties` table exists; frontend bulk upserts arrays. | Add per-listing RPCs/mutations, versioning, soft delete, audit log, moderation workflow, and realtime event fan-out. |
| Investor listings | Derived from `listingType === For Investment`. | Keep derived projection, but add investment terms, risk metadata, documents, compliance state, and investor-only policy. |
| Services directory | Separate car/wellness schemas and static provider modal. | Replace with unified `service_listings` + categories + directory pages + admin moderation. |
| Accommodation marketplace | Short-stay and hotel property types exist; no provider dashboard/rooms/bookings/revenue. | Add provider role, accommodation listings, room/unit inventory, availability, booking, payment, payout, landing pages. |
| Payments | User dashboard has placeholder payment UI; admin has simulated financial data. | Build gateway abstraction, payment intents, orders/bookings, ledger, settlements, payouts, refunds, disputes. |
| Agent wallet | Simulated wallet references exist. | Agent-only ledger-backed wallet with balances derived from entries, not stored as editable numbers. |
| Admin | Super Admin has many panels but mixed real and simulated data. | Central control centre backed by authoritative tables, lifecycle timelines, moderation queues, payment/settlement views. |
| Realtime | Properties and some user data are subscribed. | Add event-log channel, scoped subscriptions, search/projection refreshes, conflict/version handling. |
| Security | Supabase auth and some RLS. | Enforce full role matrix, owner-write policies, service-role-only settlement writes, immutable ledger/audit tables. |

---

## 2. Recommended future-state architecture

### 2.1 Logical architecture

```text
React role-specific apps/views
  - Public website and marketplace
  - Normal user dashboard
  - Agent dashboard
  - Property owner dashboard
  - Service provider dashboard
  - Accommodation provider dashboard
  - Investor dashboard
  - Admin control centre
        ↓
Frontend domain services
  - ListingService
  - ServiceDirectoryService
  - AccommodationService
  - BookingService
  - PaymentService
  - WalletService (agent-only frontend access)
  - AdminService
        ↓
Supabase RPC + RLS + Edge Functions
  - validate_listing_mutation()
  - publish_listing()
  - create_booking()
  - create_payment_intent()
  - handle_gateway_webhook()
  - post_ledger_entry()
  - run_settlement_batch()
        ↓
Central PostgreSQL source-of-truth
  - users/roles/profiles
  - listings and listing_versions
  - services and service_versions
  - accommodation inventory/availability
  - bookings/orders
  - payments/gateway events
  - wallet accounts/ledger
  - settlements/payouts
  - audit logs/event outbox
        ↓
Realtime + projections
  - Supabase realtime channels
  - event_outbox subscribers
  - search index/materialized views
  - admin timelines and moderation queues
```

### 2.2 Domain boundaries

1. **Identity and access**: users, roles, permissions, KYC, verification.
2. **Listings**: canonical record for sale/rent/investment/accommodation/transport/wellness/property-related items.
3. **Directory services**: service providers and property-related services.
4. **Accommodation commerce**: provider pages, rooms/units, availability, bookings, reviews.
5. **Transactions**: orders, payment intents, gateway webhooks, refunds, disputes.
6. **Wallet and settlement**: Agent-only wallet accounts, immutable ledger, settlement batches, payouts.
7. **Admin and compliance**: moderation, audit, risk, KYC, disputes, lifecycle timelines.
8. **Search and discovery**: projections/indexes generated from canonical records.
9. **Notifications and events**: realtime sync, user alerts, operational audit trail.

---

## 3. Database/data-model recommendations

### 3.1 Role model

Replace inconsistent role definitions with a many-to-many role model:

```sql
create type app_role as enum (
  'normal_user',
  'agent',
  'property_owner',
  'service_provider',
  'accommodation_provider',
  'investor',
  'administrator',
  'super_admin'
);

create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role app_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role)
);
```

Rationale: one actor can be both a property owner and accommodation provider, or an agent and service provider, without duplicating accounts.

### 3.2 Canonical listing model

Use **one listing record** and subtype tables for specialised data.

```sql
create type listing_kind as enum (
  'residential_sale',
  'residential_rent',
  'commercial_sale',
  'commercial_rent',
  'investment_opportunity',
  'short_term_accommodation',
  'hotel',
  'transport_rental',
  'wellness_retreat',
  'property_service'
);

create type listing_lifecycle_status as enum (
  'draft',
  'pending_review',
  'published',
  'unpublished',
  'suspended',
  'rejected',
  'archived',
  'deleted'
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  listing_number text generated always as ('AFL-' || upper(substr(id::text, 1, 8))) stored,
  kind listing_kind not null,
  status listing_lifecycle_status not null default 'draft',
  owner_user_id uuid not null references auth.users(id),
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  title text not null,
  description text not null,
  price_amount numeric,
  price_currency text not null default 'ZAR',
  address jsonb not null default '{}'::jsonb,
  coordinates geography(point, 4326),
  contact jsonb not null default '{}'::jsonb,
  amenities text[] not null default '{}',
  media jsonb not null default '[]'::jsonb,
  search_text tsvector,
  published_at timestamptz,
  unpublished_at timestamptz,
  deleted_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Subtype tables:

- `property_listing_details(listing_id, beds, baths, area, property_type, listing_type, purchase_price, neighborhood_info, verified, featured)`
- `investment_listing_details(listing_id, target_raise, min_ticket, expected_roi, occupancy_rate, documents, risk_rating, compliance_status)`
- `accommodation_listing_details(listing_id, provider_id, policies, check_in_time, check_out_time, star_rating, landing_slug)`
- `service_listing_details(listing_id, service_category_id, coverage_area, license_numbers, availability, pricing_model)`
- `transport_listing_details(listing_id, vehicle_type, daily_rate, rules, deposit_required)`
- `wellness_listing_details(listing_id, wellness_category, package_includes, per_night_price)`

### 3.3 Listing versioning and audit

```sql
create table listing_versions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  version integer not null,
  snapshot jsonb not null,
  change_summary text,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  unique (listing_id, version)
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_role app_role,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
```

### 3.4 Event outbox

```sql
create table event_outbox (
  id uuid primary key default gen_random_uuid(),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  retry_count integer not null default 0
);
```

All core mutations must write to `event_outbox` in the same transaction.

### 3.5 Service directory model

```sql
create table service_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references service_categories(id),
  slug text unique not null,
  name text not null,
  description text
);
```

Seed categories:

- property-maintenance
- cleaning
- plumbing
- electrical-services
- security
- moving-services
- interior-design
- landscaping
- property-management
- legal-services
- financial-services
- construction
- other-property-services

Use `listings.kind = 'property_service'` plus `service_listing_details` for provider directory publishing.

### 3.6 Accommodation marketplace model

```sql
create table accommodation_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  business_name text not null,
  slug text unique not null,
  verification_status text not null default 'pending',
  payout_profile_id uuid,
  created_at timestamptz not null default now()
);

create table accommodation_units (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  unit_name text not null,
  room_type text not null,
  capacity integer not null,
  base_price numeric not null,
  currency text not null default 'ZAR',
  amenities text[] not null default '{}',
  media jsonb not null default '[]'::jsonb,
  status text not null default 'active'
);

create table accommodation_availability (
  unit_id uuid references accommodation_units(id),
  stay_date date not null,
  available_count integer not null,
  price numeric not null,
  min_nights integer not null default 1,
  closed boolean not null default false,
  primary key (unit_id, stay_date)
);
```

---

## 4. Listing synchronisation architecture

### 4.1 Write path

```text
Agent/owner/provider edits listing
  ↓
Frontend validates required fields and permissions preview
  ↓
RPC: upsert_listing(input, expected_version)
  ↓
Database transaction:
  - enforce role/RLS
  - validate owner and subtype
  - update listings/subtype row
  - increment version
  - write listing_versions snapshot
  - write audit_events row
  - write event_outbox row
  ↓
Realtime event emitted
  ↓
Public views, investor views, admin queues, provider landing pages, and search projections refresh
```

### 4.2 Read path / multiple views

Do not copy listings into role-specific tables. Use views/projections:

```sql
create view public_marketplace_listings as
select * from listings
where status = 'published'
  and kind in ('residential_sale', 'residential_rent', 'commercial_sale', 'commercial_rent', 'short_term_accommodation', 'hotel');

create view investor_marketplace_listings as
select l.*, i.expected_roi, i.min_ticket, i.risk_rating
from listings l
join investment_listing_details i on i.listing_id = l.id
where l.status = 'published'
  and l.kind = 'investment_opportunity';

create view service_directory_listings as
select l.*, s.service_category_id, s.coverage_area
from listings l
join service_listing_details s on s.listing_id = l.id
where l.status = 'published'
  and l.kind = 'property_service';
```

### 4.3 Duplicate prevention

- Use a generated primary listing UUID for all views.
- Add optional duplicate detection before publish: normalized title + address hash + coordinates radius + owner.
- Enforce unique slug per landing page and provider.
- Use `expected_version` optimistic locking so stale edits cannot overwrite newer edits.

### 4.4 Real-time propagation

- Subscribe public marketplace to `listings:published` events.
- Subscribe owner dashboards to `listing:{id}` and `owner:{user_id}` channels.
- Subscribe admin to moderation events and high-risk audit events.
- Subscribe investor dashboard to `investment_opportunity.published/updated/suspended`.
- Subscribe service/accommodation directories to their listing kind updates.

---

## 5. Payment architecture

### 5.1 Gateway-agnostic design

```text
Order/Booking
  ↓
Payment Intent
  ↓
Gateway Adapter (Paystack, Flutterwave, Stripe, Ozow, Peach, mobile money, bank/EFT where available)
  ↓
Gateway Webhook
  ↓
Payment Confirmation
  ↓
Ledger Posting
  ↓
Settlement Calculation
  ↓
Payout Batch
  ↓
Reconciliation
```

Tables:

```sql
create table payment_gateways (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  display_name text not null,
  enabled boolean not null default false,
  supported_countries text[] not null default '{}',
  supported_methods text[] not null default '{}',
  supports_payouts boolean not null default false,
  config jsonb not null default '{}'::jsonb
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid references auth.users(id),
  seller_user_id uuid references auth.users(id),
  listing_id uuid references listings(id),
  order_type text not null,
  status text not null default 'draft',
  subtotal_amount numeric not null,
  platform_fee_amount numeric not null default 0,
  total_amount numeric not null,
  currency text not null,
  created_at timestamptz not null default now()
);

create table payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  gateway_id uuid references payment_gateways(id),
  amount numeric not null,
  currency text not null,
  status text not null default 'requires_payment_method',
  gateway_reference text,
  idempotency_key text unique not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table gateway_events (
  id uuid primary key default gen_random_uuid(),
  gateway_id uuid references payment_gateways(id),
  event_reference text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (gateway_id, event_reference)
);
```

### 5.2 Legal/regulatory stance

- AfriEstate should not assume direct user-to-user settlement is allowed.
- Gateway adapters must expose capabilities by country and method: collect, authorise, capture, refund, payout, split settlement, escrow/hold, chargeback notification.
- Where escrow/holding is legally unavailable, represent it as a platform-controlled pending settlement state, not a legal escrow promise.
- Payouts should be disabled until KYC/KYB and payout account verification are complete.

---

## 6. Agent-only AfriEstate Wallet architecture

### 6.1 Access rule

Wallet is exposed only if:

```text
user has active role = agent
AND agent verification/KYC status = approved
AND admin setting wallet_enabled_for_agents = true
AND wallet status != frozen/suspended
```

Normal users, investors, property owners, service providers, and accommodation providers must not see a general-purpose wallet unless a future administrator setting explicitly enables a role-specific wallet product.

### 6.2 Ledger-backed wallet tables

```sql
create table wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  owner_role app_role not null check (owner_role = 'agent'),
  currency text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (owner_user_id, currency)
);

create table wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  wallet_account_id uuid not null references wallet_accounts(id),
  transaction_id uuid not null,
  entry_type text not null,
  direction text not null check (direction in ('debit', 'credit')),
  amount numeric not null check (amount > 0),
  currency text not null,
  status text not null,
  related_entity_type text,
  related_entity_id uuid,
  gateway_reference text,
  settlement_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create view agent_wallet_balances as
select
  wallet_account_id,
  currency,
  sum(case when direction = 'credit' and status = 'available' then amount else 0 end)
    - sum(case when direction = 'debit' and status = 'available' then amount else 0 end) as available_balance,
  sum(case when status = 'pending' then amount else 0 end) as pending_balance,
  sum(case when status = 'reserved' then amount else 0 end) as reserved_balance
from wallet_ledger_entries
group by wallet_account_id, currency;
```

Important: balances are derived from immutable ledger entries. Administrators may create adjustment entries, but must not edit balances directly.

### 6.3 Agent wallet transactions

Supported ledger transaction types:

- property_transaction_commission
- service_commission
- booking_commission
- referral_income
- platform_fee
- refund
- adjustment
- withdrawal_requested
- withdrawal_paid
- payout
- chargeback
- reserve_hold
- reserve_release

Every transaction must have:

- unique transaction ID
- timestamp
- type
- amount
- currency
- status
- related listing/booking/order/payment
- gateway reference
- settlement reference
- audit event

---

## 7. Booking and settlement flow

### 7.1 Accommodation booking flow

```text
Customer selects accommodation dates/unit
  ↓
Check availability with row locks
  ↓
Create booking = pending_payment
  ↓
Create order + payment_intent
  ↓
Gateway collects/authorises payment
  ↓
Webhook confirms payment
  ↓
Booking = confirmed
  ↓
Availability decremented
  ↓
Platform commission calculated
  ↓
Provider/agent receivable becomes pending ledger entry where applicable
  ↓
Stay completed / cancellation deadline passed
  ↓
Settlement batch releases funds
  ↓
Payout sent and reconciled
```

### 7.2 Settlement tables

```sql
create table settlements (
  id uuid primary key default gen_random_uuid(),
  settlement_reference text unique not null,
  beneficiary_user_id uuid references auth.users(id),
  beneficiary_role app_role not null,
  amount numeric not null,
  currency text not null,
  status text not null default 'pending',
  scheduled_for timestamptz,
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid references settlements(id),
  gateway_id uuid references payment_gateways(id),
  payout_account_id uuid,
  amount numeric not null,
  currency text not null,
  status text not null default 'queued',
  gateway_reference text,
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
```

---

## 8. Role/permission matrix

| Capability | Normal User | Agent | Property Owner | Service Provider | Accommodation Provider | Investor | Administrator |
|---|---:|---:|---:|---:|---:|---:|---:|
| Browse public listings | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Save/search listings | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Create property listing | No | Yes | Yes | No | If accommodation | No | Yes |
| Edit own property listing | No | Yes | Yes | No | Own accommodation only | No | Yes |
| Publish own listing | No | Subject to moderation | Subject to moderation | Subject to moderation | Subject to moderation/self-service rules | No | Yes |
| Create service listing | No | Optional if role granted | No | Yes | No | No | Yes |
| Create accommodation listing | No | Optional if role granted | Optional if role granted | No | Yes | No | Yes |
| Manage rooms/availability/pricing | No | No | If accommodation owner | No | Yes | No | Yes |
| Book accommodation | Yes | Yes | Yes | Yes | No self-booking own listing | Yes | Yes |
| Submit investment request | No | No | No | No | No | Yes | Yes |
| View investor marketplace | No | No | No | No | No | Yes | Yes |
| Agent wallet | No | Yes only | No | No | No | No | Admin oversight only |
| Withdraw from agent wallet | No | Yes, own verified wallet | No | No | No | No | Can approve/freeze |
| Moderate listings/services | No | No | No | No | No | No | Yes |
| Manage payments/settlements | No | Own receipts only | Own settlements only | Own settlements only | Own settlements only | Own investment transactions | Yes |
| View audit logs | Own events only | Own events only | Own events only | Own events only | Own events only | Own events only | Full platform |

---

## 9. API/RPC requirements

### 9.1 Listing APIs

- `create_listing(input)`
- `update_listing(listing_id, expected_version, patch)`
- `publish_listing(listing_id, expected_version)`
- `unpublish_listing(listing_id, reason)`
- `archive_listing(listing_id)`
- `soft_delete_listing(listing_id, reason)`
- `submit_listing_for_review(listing_id)`
- `admin_moderate_listing(listing_id, decision, reason)`
- `get_listing_timeline(listing_id)`

### 9.2 Service directory APIs

- `create_service_listing(input)`
- `categorise_service_listing(listing_id)`
- `update_service_listing(listing_id, expected_version, patch)`
- `admin_moderate_service_listing(listing_id, decision, reason)`
- `search_service_directory(filters)`

### 9.3 Accommodation APIs

- `register_accommodation_provider(input)`
- `create_accommodation_listing(input)`
- `create_accommodation_unit(listing_id, input)`
- `update_availability(unit_id, date_range, rules)`
- `quote_booking(input)`
- `create_booking(input)`
- `cancel_booking(booking_id, reason)`
- `provider_manage_promotion(input)`

### 9.4 Payment/wallet APIs

- `list_available_payment_methods(country, transaction_type, currency)`
- `create_payment_intent(order_id, gateway_code, method)`
- `confirm_payment_intent(payment_intent_id)`
- `handle_gateway_webhook(gateway_code, payload, signature)`
- `request_agent_withdrawal(wallet_account_id, amount, payout_account_id)`
- `admin_approve_withdrawal(withdrawal_id)`
- `admin_freeze_agent_wallet(wallet_account_id, reason)`
- `download_agent_wallet_statement(wallet_account_id, date_range)`

### 9.5 Admin APIs

- `admin_search_users(filters)`
- `admin_user_lifecycle(user_id)`
- `admin_listing_lifecycle(listing_id)`
- `admin_transaction_lifecycle(order_id)`
- `admin_refund_payment(payment_id, amount, reason)`
- `admin_resolve_dispute(dispute_id, decision)`
- `admin_run_settlement_batch(date)`

---

## 10. Real-time event architecture

### 10.1 Event names

- `listing.created`
- `listing.updated`
- `listing.submitted_for_review`
- `listing.published`
- `listing.unpublished`
- `listing.suspended`
- `listing.deleted`
- `service_listing.categorised`
- `accommodation.availability_updated`
- `booking.created`
- `booking.confirmed`
- `booking.cancelled`
- `payment.intent_created`
- `payment.succeeded`
- `payment.failed`
- `refund.created`
- `settlement.created`
- `payout.paid`
- `wallet.ledger_entry_posted`
- `admin.moderation_decision`

### 10.2 Delivery model

- Database writes event to `event_outbox` in the same transaction.
- Supabase realtime notifies relevant clients.
- A background processor updates search projections/materialized views and sends notifications.
- Clients refetch canonical records by ID after event receipt instead of trusting stale payloads.
- Event processing is idempotent using event ID and aggregate version.

---

## 11. Admin control requirements

The Admin Control Centre must provide authoritative visibility over:

1. Users, roles, KYC/KYB, verification, restrictions, suspensions.
2. Agents, property owners, service providers, accommodation providers, investors.
3. Listings, service listings, accommodation pages, moderation queues.
4. Bookings, orders, payments, refunds, cancellations, chargebacks, disputes.
5. Agent wallets, ledger entries, freezes, withdrawals, statements.
6. Settlements, payout batches, failed payouts, reconciliation reports.
7. Content moderation and off-platform payment solicitation detection.
8. Platform settings: commissions, fees, gateway availability, role wallet enablement.
9. Complete transaction lifecycle:

```text
Listing → Customer → Order/Booking → Payment → Commission → Wallet Ledger → Settlement → Payout
```

Admin screens must never rely on synthetic financial values for production financial decisions.

---

## 12. Security and compliance requirements

Critical controls:

- Enforce RLS on every table.
- Use service-role-only Edge Functions for gateway webhook processing, ledger posting, settlement generation, and KYC provider ingestion.
- Use immutable ledger and audit tables; corrections are reversal/adjustment entries only.
- Use idempotency keys for payment intents, gateway events, booking creation, and payouts.
- Validate webhook signatures and reject replayed gateway events.
- Encrypt or tokenise sensitive payout account data.
- Store documents/images in private buckets unless explicitly public marketing media.
- Use signed URLs for KYC and sensitive documents.
- Add per-role and per-entity rate limits for listing updates, booking attempts, and payment intent creation.
- Add moderation controls for contact data and off-platform payment solicitation.
- Use least-privilege policies for investor financial documents and investment details.
- Add audit records for every admin action and every financial movement.

---

## 13. UX/UI improvements

### 13.1 Ecosystem navigation

- Add a role-aware app switcher in the header/dashboard shell: Marketplace, Agent Hub, Investor Hub, Services, Stays, Admin.
- Show only destinations permitted by the user's active roles.
- Keep the public website and dashboards visually consistent with the approved white/royal-blue/black system.

### 13.2 Listing management UX

- Replace bulk simulation actions with real status actions: publish, unpublish, submit for review, archive, duplicate draft, delete.
- Show sync status after saves: `Saved`, `Published`, `Pending review`, `Synced to marketplace`, `Visible to investors`, `Admin review required`.
- Show listing version, last updated timestamp, and audit timeline to owners/agents.

### 13.3 Service directory UX

- Normal users should not open a generic service modal. They should select a service category and complete a directory profile form.
- Public service cards should include category, verified state, service area, response time, contact action, reviews, and admin status where relevant.

### 13.4 Accommodation UX

- Add provider onboarding: business profile, verification, payout setup, property setup, room/unit setup, availability calendar, publish checklist.
- Provider landing pages must be generated by slug and pull from the same listing/provider/unit records.
- Add booking calendar, pricing rules, promotions, reviews, payout/revenue panels.

### 13.5 Payment/wallet UX

- Customer checkout must show available gateways by country/currency/transaction type.
- Agent wallet must clearly separate available, pending, reserved/held, and withdrawable balances.
- Wallet transaction rows must link back to order, booking, listing, payment, settlement, and audit record.

---

## 14. Performance and scalability recommendations

- Replace `saveProperties(allProperties)` with per-record mutations to avoid writing full arrays.
- Add indexes on `listings(status, kind)`, `listings(owner_user_id)`, `listings(updated_at)`, `listing_versions(listing_id, version)`, `bookings(listing_id, status)`, `payment_intents(order_id, status)`, and `wallet_ledger_entries(wallet_account_id, created_at)`.
- Use PostGIS for location search and bounding boxes.
- Use full-text search generated columns/materialized views for search.
- Paginate all marketplace, admin, transaction, and ledger queries.
- Use image thumbnails and responsive media variants.
- Split large dashboard bundles with dynamic imports.
- Avoid refetching all properties on every property event; refetch changed listing by ID or use aggregate version events.
- Use background jobs for reconciliation, search projection rebuilds, payout retries, and stale payment cleanup.

---

## 15. Priority classification and roadmap

### Phase 0 — Critical stabilisation

1. Replace bulk property upsert/delete with per-listing RPCs.
2. Add explicit owner/user IDs, role consistency, and RLS ownership policies.
3. Add listing versioning and audit log for create/edit/publish/unpublish/delete.
4. Add soft delete and moderation status.
5. Remove/silo synthetic admin financial values from production paths.

### Phase 1 — Unified listing ecosystem

1. Create `listings` canonical model and subtype detail tables.
2. Migrate current `properties`, `car_rentals`, and `wellness_services` into canonical listings.
3. Build role-specific projections/views.
4. Add realtime event outbox and client event handling.
5. Add admin lifecycle timeline and moderation queue.

### Phase 2 — Services directory

1. Create `service_categories` and `service_listing_details`.
2. Build service-provider onboarding/dashboard.
3. Add public directory and search filters.
4. Add admin approve/reject/suspend/remove actions.
5. Add service review and inquiry workflows.

### Phase 3 — Accommodation marketplace

1. Add accommodation provider role and onboarding.
2. Add provider profile/landing page slug.
3. Add units/rooms, availability, pricing, promotions.
4. Add booking creation/cancellation workflows.
5. Publish accommodation to directory, search, category pages, and featured website slots.

### Phase 4 — Payments and settlement

1. Add orders, payment gateways, payment intents, gateway webhooks.
2. Add refunds, cancellations, disputes, chargebacks.
3. Add settlement calculation and payout batches.
4. Add reconciliation reports and admin lifecycle views.
5. Integrate checkout with booking/service/commission flows.

### Phase 5 — Agent-only wallet

1. Add agent wallet accounts and immutable ledger.
2. Build wallet balances as ledger-derived views.
3. Add transaction history, statements, payout account management.
4. Add withdrawal requests, admin approvals, freezes, notifications.
5. Link every wallet entry to listing/booking/order/payment/settlement.

### Phase 6 — Scale, analytics, and governance

1. Add search index/materialized views.
2. Add BI/admin analytics based on canonical tables.
3. Add automated risk detection and moderation signals.
4. Add disaster recovery procedures and operational runbooks.
5. Add load/performance testing and observability dashboards.

---

## 16. Testing strategy

### 16.1 Unit tests

- Listing validation and role permission checks.
- Service categorisation rules.
- Availability/pricing calculations.
- Commission and platform fee calculations.
- Ledger balance derivation.
- Gateway adapter contract tests.

### 16.2 Integration tests

- Agent creates listing → public marketplace/investor/admin projections update.
- Agent edits price/images/status → realtime clients receive event and refetch canonical listing.
- Service provider creates listing → categorised → admin approves → public directory displays it.
- Accommodation provider creates unit and availability → customer books → payment succeeds → booking confirmed.
- Payment webhook duplicate event → processed once only.
- Refund/chargeback → ledger reversal and settlement adjustment.

### 16.3 RLS/security tests

- Normal user cannot edit agent listing.
- Investor cannot access non-investor private documents.
- Service provider can edit only own service listings.
- Accommodation provider cannot edit another provider's units/availability.
- Only service-role functions can post ledger entries.
- Wallet is inaccessible for non-agent roles.

### 16.4 E2E tests

- Role onboarding flows.
- Listing lifecycle from draft to published to suspended to republished.
- Booking checkout and cancellation.
- Agent wallet statement download.
- Admin transaction lifecycle investigation.

### 16.5 Operational tests

- Gateway webhook replay.
- Failed payout retry.
- Search projection rebuild.
- Realtime disconnect/reconnect.
- Database migration rollback.

---

## 17. Potential failure scenarios and recovery mechanisms

| Failure scenario | Impact | Recovery mechanism |
|---|---|---|
| Realtime event missed by client | Stale UI | Client refetches by aggregate version on reconnect; periodic stale query invalidation. |
| Concurrent listing edits | Lost update | Optimistic locking with `expected_version`; show conflict resolution UI. |
| Duplicate gateway webhook | Double ledger posting | Unique `(gateway_id, event_reference)` and idempotent processing. |
| Payment succeeds but booking confirmation fails | Paid without booking | Transactional outbox + compensation job that confirms booking or triggers refund path. |
| Availability oversold | Double booking | Row-level locks on availability rows during booking confirmation. |
| Payout fails | Seller not paid | Payout status `failed`, retry queue, admin alert, beneficiary notification. |
| Ledger imbalance | Financial reporting risk | Double-entry/reconciliation reports, immutable corrections, admin lock until resolved. |
| Admin accidental suspension | Marketplace disruption | Audit trail, reversible moderation action, notification and restore workflow. |
| Search projection stale | Missing/old listing in search | Event outbox retry and scheduled full rebuild. |
| Storage URL leakage | Privacy/compliance risk | Private buckets for sensitive assets, signed URLs, expiry, access logs. |
| Service-role secret exposure | Catastrophic data risk | Rotate keys, restrict Edge Function env, alert on unusual service-role usage. |

---

## 18. Exact architectural/product changes required

1. **Stop treating properties as an array document.** Introduce per-entity commands and persist each listing independently.
2. **Adopt a central `listings` aggregate.** Keep one listing ID across public, agent, investor, service, accommodation, search, and admin views.
3. **Use subtype tables and views.** Do not create duplicate platform-specific records.
4. **Add `event_outbox` and audit logs.** Every mutation produces an event and immutable timeline record.
5. **Unify role management.** Support all required roles through `user_roles`, not a single incompatible enum.
6. **Build the services directory on canonical listings.** Categories and directory profiles should be first-class and searchable.
7. **Build accommodation as commerce, not just a property type.** Add provider profiles, landing pages, units, availability, bookings, promotions, payments, and payouts.
8. **Introduce gateway-agnostic payments.** Payment adapters must be swappable and capability-aware by country/currency/method.
9. **Implement Agent Wallet as an immutable ledger product.** Show wallet only to approved agents, derive balances from entries, and link every entry to a transaction lifecycle.
10. **Make Admin the operational control plane.** It must manage lifecycle, moderation, compliance, payments, wallet, settlements, disputes, and complete transaction timelines from canonical tables.
11. **Add robust testing and reconciliation.** Financial and listing synchronisation flows must be covered by integration, RLS, E2E, and operational tests.

