# Deployment task: ship the new FoodLens landing page to demo.foodlensgroup.com

You are deploying a Next.js app. The code is already written and verified — your
job is to get it onto GitHub, wire up Firebase Storage, point Vercel at it, set
environment variables, and verify it works. Do NOT rewrite the app logic.

## Credentials & access you need before starting
Confirm you have ALL of the following. If any is missing, stop and ask Diego for it
rather than guessing.

1. **GitHub access** to `dgocostta/Foodlens-LP1` with push rights (a logged-in
   GitHub CLI / git credential, or a personal access token).
2. **Vercel access** to the account/team that owns the project serving
   demo.foodlensgroup.com (dashboard login, or a Vercel token + the project name).
3. **Firebase Console access** to the FoodLens project (to enable Storage and read
   the bucket id). Same project the existing Firestore lives in.
4. **The secret env values.** These already exist — read them, don't invent them.
   Source of truth (in priority order):
   a) the file `C:\Users\User\Documents\Claude\Projects\How to use Claude\FoodLens\demo-site\.env.local`
      (contains FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
       RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO, LEAD_NOTIFICATION_TO), or
   b) the existing Vercel project's Environment Variables (old repo), or
   c) Firebase Console → Project Settings → Service Accounts (regenerate a private
      key only as a last resort — it invalidates the old one).
5. **Two values that are NOT pre-existing — get these explicitly:**
   - `FIREBASE_STORAGE_BUCKET` — you obtain this in Step 2 (after enabling Storage).
   - `ADMIN_KEY` — the password that unlocks /admin. Ask Diego for the value he
     wants, OR generate a strong random string and report it back to him so he can
     log in. Do not leave it as the insecure default.

Handle all secrets carefully: never commit them to git, never paste them into the
repo, never print full secret values in logs or your final report (mask them, e.g.
`AIza…`). They go only into Vercel's Environment Variables.

## Context
- New landing page repo (GitHub): https://github.com/dgocostta/Foodlens-LP1  (branch: main)
- The updated, ready-to-ship code is in this local folder:
  `C:\Users\User\Documents\Claude\Projects\How to use Claude\FoodLens\foodlens-lp1`
  (If that differs on this machine, ask me for the path to the `foodlens-lp1` folder.)
- The Vercel project that currently serves **demo.foodlensgroup.com** is connected to
  the OLD repo `dgocostta/FoodLens-Demo-pages`. We are keeping that same Vercel project
  (it owns the domain) and re-pointing it at `Foodlens-LP1`.
- Stack: Next.js 14 (App Router, JavaScript), Firebase Admin SDK (Firestore + Storage),
  Resend for email. Backend was just migrated from MongoDB to Firebase.

## Goal / acceptance criteria
1. `Foodlens-LP1` main branch contains the updated code.
2. demo.foodlensgroup.com serves the NEW landing page.
3. Submitting the signup form: writes a doc to Firestore `leads`, sends an internal
   email to LEAD_NOTIFICATION_TO, and a welcome email to the owner (if email given).
4. Uploading a photo on the onboarding screen stores it in Firebase Storage under
   `leads/<leadId>/...` and flips the lead `status` to `photos_uploaded`.
5. /admin unlocks with ADMIN_KEY and shows leads + photo thumbnails + status.

## Step 1 — Push the code to GitHub
The updated files vs. the original repo are:
`package.json`, `next.config.js`, `.env.local.example`, `lib/firebase-admin.js`,
`lib/email.js`, `app/api/[[...path]]/route.js`, `app/onboarding/page.js`,
`app/admin/page.js` (plus `.gitignore`).

Push the contents of the `foodlens-lp1` folder to `dgocostta/Foodlens-LP1` main.
Either copy these files over an existing clone, or from inside the folder:

    git init                              # only if not already a repo
    git remote add origin https://github.com/dgocostta/Foodlens-LP1   # if missing
    git add -A
    git commit -m "Switch backend to Firebase: Firestore leads, Storage uploads, Resend emails"
    git push origin main                  # use --force only if intentionally replacing history

Do NOT commit any `.env.local` file or real secrets.

## Step 2 — Enable Firebase Storage
In the Firebase project used by FoodLens (same project as the existing Firestore):
1. Console → Build → Storage → Get started → accept default rules.
2. Copy the bucket id (e.g. `your-project.firebasestorage.app`, or on older
   projects `your-project.appspot.com`). You'll need it as FIREBASE_STORAGE_BUCKET.
The app uses the Admin SDK (bypasses Storage security rules) and serves images via
short-lived signed URLs, so no public-read rule is required.

## Step 3 — Re-point Vercel at the new repo (keep the domain)
In the EXISTING Vercel project serving demo.foodlensgroup.com:
- Settings → Git → disconnect `FoodLens-Demo-pages` and connect
  `dgocostta/Foodlens-LP1` (branch main).
- Leave the domain attached to this project (don't move/delete it).
- Framework preset: Next.js. Build command/output: defaults.

## Step 4 — Environment variables (Vercel → Settings → Environment Variables)
Set these for Production AND Preview. The Firebase/Resend values are identical to
the ones already in `FoodLens/demo-site/.env.local` (or already present on the old
Vercel project) — reuse them. Two are NEW (marked ★).

    FIREBASE_PROJECT_ID        = (same as demo-site)
    FIREBASE_CLIENT_EMAIL      = (same as demo-site)
    FIREBASE_PRIVATE_KEY       = (same as demo-site)  ← paste the FULL key incl.
                                  -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----
                                  Real newlines are fine; literal \n is also handled in code.
    FIREBASE_STORAGE_BUCKET    = (bucket id from Step 2)            ★ NEW
    RESEND_API_KEY             = (same as demo-site)
    RESEND_FROM                = FoodLens <noreply@send.foodlensgroup.com>
    RESEND_REPLY_TO            = (same as demo-site, optional)
    LEAD_NOTIFICATION_TO       = info@foodlensgroup.com
    ADMIN_KEY                  = (choose a strong secret; unlocks /admin)   ★ NEW

If FIREBASE_PRIVATE_KEY gives auth errors, it's almost always a newline issue:
ensure it wasn't flattened. The code does `privateKey.replace(/\\n/g, "\n")`, so
either real newlines or escaped `\n` both work — but not a key with stripped newlines.

## Step 5 — Deploy & verify
1. Trigger a redeploy (Deployments → Redeploy, or it auto-deploys on push).
2. Confirm the build succeeds (it builds clean on Vercel; SWC is fine there).
3. Open https://demo.foodlensgroup.com and submit the signup form. Verify:
   - 200 response; a new doc in Firestore `leads`.
   - Internal email arrives at info@foodlensgroup.com; welcome email to the owner.
4. On the onboarding screen, upload a photo. Verify:
   - File appears in Storage under `leads/<leadId>/...`.
   - Lead `status` becomes `photos_uploaded`.
5. Open https://demo.foodlensgroup.com/admin, enter ADMIN_KEY, confirm the lead row,
   photo thumbnail, and status render.
6. API health check: `GET https://demo.foodlensgroup.com/api` should return
   `{ ok: true, service: "foodlens-api" }`.

## Notes / gotchas
- Keep the domain on the SAME Vercel project; do not create a new domain mapping.
- After everything passes, the repo can be set back to private — Vercel stays
  connected and keeps deploying.
- `next@14.2.3` has a published security advisory. Optional but recommended:
  bump to the latest 14.2.x patch (`npm i next@^14.2`) and redeploy.
- Endpoint `POST /api/leads/<id>/generate-video` is an intentional stub (returns
  "not implemented") for a future photo→video automation. Leave it as-is.
- Do not change the API path structure (`app/api/[[...path]]/route.js` is a
  catch-all that handles /api/leads, /api/leads/:id/photo, /api/settings/media,
  /api/admin/verify).

Report back: the live URL build status, a screenshot of /admin with a test lead,
and confirmation that the test photo landed in Storage.
