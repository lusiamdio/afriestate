# Platform Security & Diagnostic Walkthrough

# Security Summary

## Reviewed Files

- `server.ts` — Express server middleware, rate limiting, RapidAPI travel/safety/visa endpoints, Gemini AI proxy routes, WebSocket bridge, and payment settlement API.
- `components/payments/PaymentSettlementPanel.tsx` — Checkout settlement form for short stays and car hire.
- `components/flights/FlightBookingFlow.tsx` — Multi-step flight booking and settlement workflow.
- `components/pages/RentACarPage.tsx` — Transport rentals, car sales inquiry flow, and Supabase persistence.
- `components/pages/PropertyDetailPage.tsx` — Property intelligence, safety benchmark widget, and valuation client calls.
- `components/pages/NeighborhoodExplorerPage.tsx` — Neighborhood safety benchmark and AI grounded briefs.
- `contexts/AdminStateContext.tsx` — Platform governance synchronization and admin audit logging.
- `lib/data.ts` — Supabase database queries, profile updates, messaging, and service publishing helpers.
- `lib/security.ts` & `lib/ai.ts` — Client input sanitization, CSPRNG booking reference generation, CSV formula escaping, and AI client wrapper.
- `package.json` — Production and development dependency manifest.

## Issues Resolved

| Risk Area | File(s) | Remediation Applied |
| :--- | :--- | :--- |
| Payment Card Data & CVV Exposure | `server.ts`, `components/payments/PaymentSettlementPanel.tsx`, `components/flights/FlightBookingFlow.tsx` | Removed raw `cardCvv` and reconstructed PAN transmission over HTTP; client validates format ephemerally and transmits only `{ cardLast4, cardBrand, cardExpiry }`. Server rejects payloads containing raw card numbers (>4 digits) or CVV fields with HTTP `400`. |
| Non-Cryptographic Settlement & Booking IDs | `server.ts`, `components/flights/FlightBookingFlow.tsx`, `components/pages/RentACarPage.tsx` | Replaced `Math.random()` transaction references, settlement IDs, authorization codes, and car inquiry IDs with Node `crypto.randomInt` / `crypto.randomBytes` and Web Crypto `generateSecureBookingRef`. |
| Unthrottled Non-AI API Endpoints & WebSocket Bridge | `server.ts` | Extended sliding-window per-IP rate limiting to `/api/payments` (30 req/min), `/api/visa` (90 req/min), `/api/travel` (120 req/min), and `/api/neighborhood` (120 req/min); enforced `2 MB` `maxPayload` and a 25-connection concurrency cap on `/api/live`. |
| PostgREST Filter String Interpolation | `lib/data.ts` | Sanitized and double-quoted user identifiers in `getMessagesForUser` `.or(...)` filter expressions to block PostgREST operator injection (`sender_username.eq."..."`). |
| Database Column Mismatch & Unscoped Governance Writes | `lib/data.ts`, `contexts/AdminStateContext.tsx` | Replaced camelCase spread + invalid `.eq()` on `.upsert()` in `updateAgentProfile` with explicit snake_case columns and `{ onConflict: 'username' }`; gated `platform_governance` Supabase upserts to authenticated admin sessions. |
| Vulnerable Unused Packages & Dead Auth Component | `package.json`, `components/AuthModal.tsx` | Removed unused `firebase`, `@google-ai/generativelanguage`, `leaflet`, `react-leaflet`, and `rehype-raw` packages carrying transitive high/critical advisories; removed unused `AuthModal.tsx` containing legacy demo social login state. |

## Safeguards Verified

| Control | Location | Verification Status |
| :--- | :--- | :--- |
| Video Proxy Target Allowlist | `server.ts` (`/api/gemini/video-proxy`) | Restricts proxying strictly to HTTPS URLs on `generativelanguage.googleapis.com` or `*.googleapis.com` and injects API keys server-side only. |
| Online Settlement Scope Guardrail | `server.ts` (`/api/payments/settle`) | Rejects settlement requests outside `['flight', 'short-stay', 'car-hire']` with HTTP `403`, bounds positive amounts (`<= 50,000,000`), and enforces 3-letter ISO currency codes. |
| Security Response Headers | `server.ts` | Applies `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`. |
| Markdown & URL Sanitization | `components/BlogDetailModal.tsx`, `lib/security.ts` | Renders Markdown without `rehype-raw` (raw HTML disabled) and sanitizes dynamic URLs via `sanitizeSafeUrl` / `isSafeExternalHref` (`https://`, `mailto:`, `/images/`). |
| CSV Export Formula Neutralization | `lib/security.ts` (`escapeCsvCell`) | Prefixes spreadsheet formula triggers (`=`, `+`, `-`, `@`, tab, CR) with a single quote and escapes embedded quotes. |

---

## PoC Verification

### 1. PCI-Safe Payment Settlement & Input Validation (`/api/payments/settle`)
1. **Reproduction Before Fix**: Posting `{ paymentMethod: "Card", paymentDetails: { cardNumber: "4532000000001234", cardCvv: "123", cardExpiry: "12/28" } }` from the checkout form transmitted raw `cardCvv` and padded card digits to the Node backend, which issued `Math.random()`-derived `authorizationCode` and `transactionRef` values without rate limits.
2. **Patch Applied**:
   - `PaymentSettlementPanel.tsx` and `FlightBookingFlow.tsx` validate card length, `MM/YY` expiry, and CVV locally and send `{ cardLast4, cardBrand, cardExpiry }` only.
   - `server.ts` explicitly rejects any payload including `cardCvv` or >4 PAN digits (`400 Bad Request`), enforces currency format + upper transaction cap, generates IDs via `crypto.randomInt` and `crypto.randomBytes`, and limits requests to `30/min` per IP.
3. **Verification Probe**:
   - Request with raw `cardCvv` returns HTTP `400` (`Raw card PAN and CVV codes must never be transmitted...`).
   - Request with `cardLast4: "1234", cardBrand: "Visa", cardExpiry: "12/28"` returns HTTP `200` with `settlementMode: "sandbox-gateway"` and CSPRNG identifiers.

### 2. PostgREST Filter Escaping (`lib/data.ts:getMessagesForUser`)
1. **Reproduction Before Fix**: Calling `getMessagesForUser('alice,receiver_username.neq.null')` interpolated unquoted operators directly into `.or(\`sender_username.eq.${username},...\`)`.
2. **Patch Applied**: `sanitizeText` strips HTML/control chars, strips `,`, `(`, `)`, `"`, and `\`, and wraps the identifier in double quotes (`sender_username.eq."..."`).
3. **Verification**: Malformed filter operators can no longer escape the equality literal in PostgREST query strings.

### 3. African Airport Search & City Safety Benchmark (`/api/travel/airports/search`, `/api/neighborhood/safety-index`)
1. **Reproduction Before Fix**: `GET /api/travel/airports/search?query=Cape` returned `{"airports":[]}` because TripAdvisor omitted partial African matches and the local gateway list held zero African airports. `GET /api/neighborhood/safety-index?city=Cape%20Town` returned `{ crimeIndex: null, safetyIndex: null }`, displaying `N/A` in the UI.
2. **Patch Applied**: Expanded the server directory to 47 African & global gateway airports, added Booking.com airport fallback, enriched safety responses with `hasNumericIndices`, `riskTier`, and `globalRankPercentile`, and updated `PropertyDetailPage.tsx` and `NeighborhoodExplorerPage.tsx` to display `Watchlist Tier` and `Country Peers` rather than `N/A`.
3. **Verification**: `GET /api/travel/airports/search?query=Cape` returns `CPT` (`Cape Town International Airport`) and `GET /api/neighborhood/safety-index?city=Cape%20Town&country=South%20Africa` returns `matched` with `rank`, `riskTier`, and `countryPeerCount` cleanly.
