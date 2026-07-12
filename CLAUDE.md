# CLAUDE.md — FoodLens (demo.foodlensgroup.com) project guide

Read this first every session. This is the **marketing / lead / affiliate** site (NOT the separate product app
at foodlensgroup.com — that's a different codebase; see FOODLENS_PRODUCT_OVERVIEW.md). Owner: Diego. It is
**LIVE and in daily use** — be careful, additive changes preferred, never break the flows listed below.

## Stack
- **Next.js 14.2.35**, App Router, **JavaScript** (.js/.jsx). Tailwind 3, shadcn/ui (Radix), lucide-react, Inter.
- Backend: **Firebase** project `foodlens-backend-bf4e1` (Blaze), Firestore (europe-west1) + Storage
  (bucket `foodlens-backend-bf4e1.firebasestorage.app`, CORS set), via **firebase-admin** in
  `lib/firebase-admin.js` (`getDb()` / `getBucket()` singletons; env values are `.trim()`'d).
- Email: **Resend** (`lib/email.js`).
- **One catch-all API:** `app/api/[[...path]]/route.js` handles everything (/api/leads, /api/affiliates,
  /api/uploads/sign, /api/settings/media, etc.).
- Deploy: **git push `main` → Vercel auto-deploys** (project "demo-site"). Diego (or Chap) runs the push.

## Auth model (important)
- **Admin** (`/admin`) is gated by a shared **`ADMIN_KEY`** (env) sent as a header. No per-user login.
- **Affiliates** have **no password** — the affiliate **CODE** (e.g. `FL-MARIA-7G2`) is the key + attribution ID.
  Codes are generated on **approval only**. Affiliate-facing pages read state by validating `?code=`.

## Firestore collections
- `leads` — inbound leads (public signup + affiliate/field intake). status pipeline: new → contacted →
  photos_uploaded → video_generating → video_sent → won → lost. Has affiliateCode/affiliateName for attribution.
- `affiliates` — { name,email,phone,social,status(pending|approved|paused|rejected), code, foundingNumber,
  checklist, workbook, trainingAckAt, avatarUrl, ... }. Approve → generate code + email.
- `settings/media` — homepage cinema menu + deck media.
- `leadBank` — (being built) cold scraped restaurant prospects; see LEAD_BANK_BUILD_PROMPT.md.

## Key files
`lib/firebase-admin.js`, `lib/email.js`, `lib/upload.js` (image = multipart; large/video = direct-to-Storage
signed upload), `lib/affiliate-program.js` (commission tiers + ranks), `lib/affiliate-kit-content.js` (Bank
swipe copy — real content), `lib/foodlens-data.js`. Pages: `app/page.js` (public LP + signup),
`app/onboarding/page.js`, `app/admin/page.js` (mini-CRM: Leads/Media/Affiliates tabs), `app/join/page.js`
(affiliate application), `app/field/page.js` (code-gated field intake), `app/field/kit/page.js` (affiliate
dashboard), `app/presentation/page.js`, `components/logo.js`, `app/layout.js`.

## LIVE flows — do NOT break
Public signup → lead + emails; onboarding uploads; /join application → affiliate; approval → code + email;
/field code-gated intake; /field/kit affiliate dashboard (checklist, workbook, kit, rank); /admin CRM; Resend
emails (welcome, lead-notify, affiliate received/approved, send-link — reply-to routing: leads→info@,
affiliates→affiliates@). Attribution via ?ref=CODE on the homepage and /join.

## Conventions
- Brand: dark **zinc-950 (#0a0a0b)** + **Action Orange (#ff5a1f)**, gradient-orange highlight headings, glass
  navs, Inter, mobile-first (keep `overflow-x:hidden`). Admin surfaces = calmer dark-charcoal dashboard look.
- Reuse existing patterns: the catch-all API structure, the lead model, the direct-upload pipeline, the admin
  tab/detail structure, the `<Logo>` component, the affiliate code-validation pattern.
- **Verify before deploy:** run `next build` / lint; fix red before committing. Deploy = push to main (Diego runs it).

## Env vars (set in Vercel)
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET, RESEND_API_KEY,
RESEND_FROM (noreply@send.foodlensgroup.com), RESEND_LEAD_REPLY_TO (info@), RESEND_AFFILIATE_REPLY_TO
(affiliates@), LEAD_NOTIFICATION_TO, PUBLIC_BASE_URL, ADMIN_KEY. (Future: OPENAI_API_KEY for menu AI /
admin assistant.)

## Gotchas
- Vercel serverless body limit ~4.5MB → large files use the direct-to-Storage signed-upload path (already built).
- Firestore multi-field filters may need composite indexes (console auto-suggests a create link — expected).
- Keep changes additive on the live site; prefer new collections/endpoints/tabs over rewiring live flows.

## Spec docs to read for specific work
- LEAD_BANK_BUILD_PROMPT.md + APIFY_SCRAPER_GUIDE.md — the Lead Bank feature + scraper loop.
- AFFILIATE_CONSOLE_BRIEF.md, AFFILIATE_GAMIFICATION_VISION.md — affiliate system + roadmap.
- PRODUCT_ROADMAP_NOTES.md, QUEUED_BUILD_PROMPTS.md — queued work (menu-AI intake, i18n, etc.).
- FOODLENS_PRODUCT_OVERVIEW.md + INTEGRATION_REQUIREMENTS_PRODUCT.md — the SEPARATE product app + the (parked)
  import/claim integration.
- FOUNDING100_INSTAGRAM_LAUNCH_PLAN.md, FABLE5_VIDEO_DIRECTOR_PROMPT.md — marketing/content (not code).
