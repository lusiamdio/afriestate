<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/431f6619-2bb6-47f8-88cb-c451b67768ba

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then configure `VITE_AI_GATEWAY_URL` for the production AI gateway. For local-only development, set both `VITE_OPENROUTER_API_KEY` and `VITE_GEMINI_API_KEY` to enable OpenRouter-first generation with Gemini failover.
3. Run the app:
   `npm run dev`


## Platform architecture diagnostic

See [`docs/afriestate-platform-diagnostic.md`](docs/afriestate-platform-diagnostic.md) for the full end-to-end platform diagnostic, current-state assessment, future-state unified ecosystem architecture, data-model recommendations, payment and Agent Wallet architecture, role matrix, realtime event model, implementation roadmap, testing strategy, and recovery plan.

## Production hardening

Apply `supabase_production_hardening.sql` to remove the legacy plaintext password surface, align table columns with the frontend data layer, add investor deal/commitment foundations, and replace prototype public policies with role-aware RLS. Keep `VITE_DEMO_MODE=false` in production so failed backend writes surface as errors instead of demo fallbacks.

## Validation

- `npm run typecheck`
- `npm run build`
- `npm test`

## AI provider configuration

All text AI features use the shared `lib/ai.ts` provider boundary. It sends requests to OpenRouter first and falls back to Gemini when OpenRouter is unavailable. Image, video, and realtime voice features use Gemini through that same boundary because they require Gemini-specific APIs. In production, point `VITE_AI_GATEWAY_URL` at an authenticated server-side gateway which holds both provider credentials; do not place provider secrets in `VITE_*` variables.

## Biometric KYC provider integration

AfriEstate includes a KYC verification surface for agents and investors. The frontend records the user's KYC state in `kyc_verifications` and expects face matching to be performed by a private backend service that wraps FaceOnLive's open-source Windows SDK: https://github.com/FaceOnLive/Face-Recognition-SDK-Windows.git.

Production deployment guidance:

- Run the FaceOnLive SDK on a locked-down Windows worker or API service; do not execute biometric matching in the browser.
- Upload identity documents and selfies to private storage, then pass only signed URLs or encrypted object references to the KYC service.
- Persist normalized status, provider reference, face-match score, and liveness score in Supabase; never store raw biometric templates in frontend state.
- Keep investor deal requests gated behind an approved KYC status.
