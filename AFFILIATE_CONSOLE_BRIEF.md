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
