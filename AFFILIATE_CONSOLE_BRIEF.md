# ⚠️ SCOPE & READ ORDER — READ THIS FIRST

- **BUILD NOW → "PHASE 1 — Affiliate / Promoter program" (at the very bottom of this file).**
  No logins; code-based attribution. It lives in THIS repo (foodlens-lp1 → demo.foodlensgroup.com).
- **DO NOT build now:** the full per-affiliate **Firebase Auth login** system described in the
  "NEW REQUIREMENT" section below — that's **Phase 2 / later**.
- **Separate project (NOT this repo):** the full "Business Mission Control" dashboard
  (C:\DEV\clients\Admin-Foodlens\Foodlens_Dashboard_Mockup.html). The authed console may eventually
  live there, not in this site.

The middle of this doc is background/architecture for the bigger vision. The actionable build is
PHASE 1 at the end.

---

# FoodLens — Handoff brief (for a fresh chat: Affiliate / Ambassador console)

Paste or attach this file at the start of the new chat so it resumes with full context.

## What this project is
- Live site: **demo.foodlensgroup.com** (QR destination from a printed flyer).
- GitHub: **dgocostta/Foodlens-LP1** (branch `main`). Deploy host: **Vercel** (the project that owns the domain; auto-deploys on push to main).
- Local working folder (Cowork): `...\Documents\Claude\Projects\How to use Claude\FoodLens\foodlens-lp1`.

## Stack
- Next.js **14.2.35**, App Router, **JavaScript** (.js/.jsx), Tailwind 3, shadcn/ui (Radix), lucide-react.
- Backend: **Firebase** project `foodlens-backend-bf4e1` (Blaze plan, billing healthy).
  - **Firestore** (region europe-west1) + **Storage** (bucket `foodlens-backend-bf4e1.firebasestorage.app`, CORS configured for the domain).
  - Accessed server-side via **firebase-admin** in `lib/firebase-admin.js` (getDb/getBucket).
- Email: **Resend** (`lib/email.js`) — welcome + internal "new signup" notification.
- One catch-all API: **`app/api/[[...path]]/route.js`** handles everything.

## Data model (Firestore)
- `leads` collection: { restaurantName, ownerName, instagram, phone, email, dishes:[{name,size}], photos:[{path,name,contentType,size,uploadedAt}], video, status, source, createdAt, updatedAt }
  - status pipeline: new → contacted → photos_uploaded → video_generating → video_sent → won → lost
- `settings/media` doc: { dishes:[{id,name,price,tag,desc,video,poster}] } — controls the homepage cinema menu AND the deck's Solution slide.
- Storage paths: `leads/<leadId>/...` (lead uploads), `media/...` (demo clips).

## What's built & live
- Public landing page (`app/page.js`): signup form (restaurant, owner, instagram, phone, email + up to 5 dish photos) → creates lead → onboarding.
- Onboarding (`app/onboarding/page.js`): upload a photo/video → thank-you + ready-to-paste social caption.
- Admin mini-CRM (`app/admin/page.js`): **gated by a shared `ADMIN_KEY`** (env). Tabs: Leads (table + detail panel: pipeline stages, email/WhatsApp/Instagram quick actions, photo gallery, "Generate video" STUB) and Media (edit/upload demo clips, Save & Publish).
- Pitch deck (`app/presentation/page.js`).
- Uploads: images via multipart API; **videos via direct browser→Storage signed upload** (`/api/uploads/sign` + `/api/leads/:id/photo-record` for leads, `/api/settings/media/finalize` for media). `lib/upload.js` is the client helper.
- Logo: full lockup `/public/foodlens-logo.png` + icon `/public/foodlens-icon.png`.

## Env vars (already set in Vercel)
FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET,
RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO, LEAD_NOTIFICATION_TO, ADMIN_KEY.

## NEW REQUIREMENT — Affiliate / Ambassador field-app console
Goal: real per-user logins so affiliates can work in the field; the seed of the "Business Console."
- **Affiliate (ambassador) account**: logs in → enters restaurant + owner/manager info → takes photos/videos on the spot → uploads → sees **only their own leads** and statuses.
- **Admin (Diego)**: sees **ALL** leads globally, **which affiliate** each is assigned to, and their activity/actions.
- **Patric + Diego** also have logins. Onboard a new affiliate by sending them a link → they start immediately.
- **Role-based permissions** (affiliate vs admin), replacing today's shared ADMIN_KEY for the human users.

### Recommended approach (to confirm in new chat)
- Use **Firebase Authentication** (already on Firebase). Likely email + password, or passwordless email-link.
- Add a `users` collection (or custom claims) with `role: admin | affiliate`, name, email.
- Tag each lead with `affiliateUid` + `affiliateName`; affiliate queries filter by their uid; admin sees all.
- New authed routes, e.g. `/app` (affiliate field dashboard, mobile-first capture+upload) and keep `/admin` for global view (migrate it from ADMIN_KEY to real auth/role).
- Reuse the existing direct-upload pipeline for on-the-spot photos/videos.

### First design decisions for the new chat
1. Auth method: email+password vs passwordless email-link.
2. How affiliates are created: admin-creates accounts, or self-signup via an invite link/code.
3. Whether to keep ADMIN_KEY as a fallback or fully move admin to Firebase Auth + role.

## Known gotchas
- The Cowork mounted folder can **truncate large file writes** done via the file tools / python `open().write()`. Write big files via bash `cat > file <<'EOF'` or `cp` from /tmp, and if a file looks cut off, recover with `git show HEAD:path > /tmp/x` then `cp` back. Verify with esbuild parse.
- Full `next build` can't complete in the Cowork sandbox (SWC SIGBUS) — verify code with `esbuild --loader:.js=jsx` parse instead; real builds run on Vercel.
- Vercel serverless body limit ~4.5MB → large files must use the direct-to-Storage signed-upload path (already built).

## Still-open items (besides the new console)
- `flyer.foodlensgroup.com` subdomain for the old flyer page (separate Vercel project + domain).
- Real Kling/Hedra video generation behind the admin "Generate video" button (needs an API key).
- Confirm Resend sending domain (`send.foodlensgroup.com`) is verified so lead emails deliver.

---

# PHASE 1 — Affiliate / Promoter program (BUILD THIS FIRST)
No per-user login. The **affiliate CODE** is the spam-guard, the attribution ID, AND the bridge to
real accounts later. **Codes are generated on APPROVAL, never at signup.**

## Foundation (do first — underpins all three builds)
- Firestore `affiliates` collection: { name, email, phone, social, audience/note,
  status: 'pending' | 'approved' | 'paused' | 'rejected', code, createdAt, approvedAt, adminNotes }
- Extend `leads` docs with: `affiliateCode`, `affiliateName` (referred-by).
- API (extend the catch-all `app/api/[[...path]]/route.js`):
  - `POST /api/affiliates` (public) — promoter application → saved as status 'pending'.
  - `GET /api/affiliates` (admin) — list applications.
  - `PUT /api/affiliates/:id` (admin) — approve / reject / pause; on **approve** → generate a unique
    code (e.g. FL-MARIA-7G2) + send approval email.
  - `GET /api/affiliates/validate?code=` (public) — field intake checks a code is valid + approved.
- Emails (Resend, reuse `lib/email.js`): "application received" to applicant; internal notify to
  LEAD_NOTIFICATION_TO on new application; "approved — here's your code + Kit link" on approval.

## Build 1 — Field Lead Intake page (`/field`) with affiliate-code gate
- Promoter enters their code → validated via /api/affiliates/validate → unlocks the restaurant
  lead form (reuse the signup form + on-the-spot photo/video upload pipeline).
- Submitted lead is tagged `affiliateCode` + `affiliateName`, `source: 'promoter'`.

## Build 2 — Promoter landing + signup (`/join`)
- Landing page selling "become a FoodLens affiliate" + an application form → saves to `affiliates`
  as 'pending'. Confirmation screen + "application received" email. (No code issued here.)

## Build 3 — Admin "Affiliates" tab (beside Leads / Media)
- List applicants with status labels (pending / approved / paused / rejected).
- **Approve** → generates the code + sends approval email + unlocks Kit. Reject / pause.
- See each affiliate's referred leads + counts; `adminNotes` field for scheduling 101s.
- Leads tab also gains a "Referred by" column + filter.

## Plus — Affiliate Kit page (`/field/kit`)
- Static page: downloadable assets, email copy, cold-DM scripts, each with a copy button.
- Optionally code-gated; linked from the approval email. Content managed by Diego.

## Recommended BUILD ORDER (respects dependencies)
Foundation → Build 3 (admin approve, so codes can exist) → Build 2 (promoter signup) →
Build 1 (code-gated field intake) → Kit.

## Decisions locked
- Phase 1 = NO passwords; the code is the key + attribution ID.
- Code generated on approval only.
- Phase 2 (later) = real Firebase Auth accounts mapping each code → a login, feeding the future
  "Business Mission Control" dashboard (separate project: C:\DEV\clients\Admin-Foodlens\Foodlens_Dashboard_Mockup.html).

---

# BRANDING, LAYOUT & LANGUAGES (applies to all Phase 1 pages)

## Brand tokens — match demo.foodlensgroup.com
- Dark theme: bg `zinc-950`, text `zinc-50`. Accent: **orange** (`orange-500` / #ff5a1f);
  use `text-gradient-orange` for highlight headings; `glass` (backdrop-blur) nav bars.
- Stack: Tailwind 3 + shadcn/ui (Radix) + lucide-react icons. Inter font (configured in layout.js).
- Mobile-first; keep the `overflow-x: hidden` scroll lock (no sideways drag).

## Logo placement — reuse the `<Logo>` component (components/logo.js)
- **Full lockup** `/foodlens-logo.png` → top-left nav, footer, centered on login/auth cards (size lg).
- **Icon-only** `/foodlens-icon.png` → favicon (layout.js) + any tiny/square watermark.
- Height-scaled, width auto — never stretch.

## Differentiate the surfaces (Diego's request)
- **Promoter recruitment landing (`/join`)** = marketing style — same splashy hero/gradient energy
  as the public site, built to SELL becoming an affiliate.
- **Operational surfaces** (`/field`, `/field/kit`, Admin "Affiliates" tab) = a calmer **dashboard/app
  aesthetic**: a subtle **grid / dotted background**, card-based panels, denser tables — same brand
  colors + logo, but clearly "the tool," not the brochure. The grid texture is the visual cue that
  sets the back-of-house apart from the front-end marketing pages.

## Languages / i18n — LAST in the queue (only after the 4 builds work)
- Must **match foodlensgroup.com's language toggle** — inspect that site's toggle and replicate its
  pattern, placement, and behavior so it feels native to the brand.
- Locales: **English (default), Spanish (es), Portuguese-Portugal (pt-PT), Portuguese-Brazil (pt-BR),
  Ukrainian (uk), Hindi (hi) / main Indian language(s)**.
- Implementation: dictionary/JSON-per-locale (or next-intl) consistent with the main site; persist the
  choice in localStorage like the rest of the app.
- Apply to the public Phase-1 pages (`/join`, `/field`, `/field/kit`). Admin can stay English for now.
