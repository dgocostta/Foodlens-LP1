# FoodLens new landing page — deploy & handoff

This is the new landing page (`Foodlens-LP1`), rewired to use **Firebase** instead
of MongoDB. It will go live at **demo.foodlensgroup.com** by reusing the Vercel
project that already owns that domain.

## What changed vs. the original repo
- Backend swapped from **MongoDB → Firebase** (Firestore for leads + settings).
- New leads now trigger **emails via Resend**: an internal "new signup"
  notification to your team, plus a welcome email to the owner (if they gave one).
- The onboarding **photo upload is now real** — files go to **Firebase Storage**
  and are attached to the lead. (Originally it was a fake preview.)
- The **/admin** dashboard now reads from Firestore and shows photo thumbnails
  and a lead **status** (New → Photos in → Video queued → Video sent).
- Lead records carry `status`, `photos[]`, and a `video` field so the future
  photo-to-video automation can plug in. The endpoint
  `POST /api/leads/<id>/generate-video` is stubbed with a clear TODO.
- Removed `mongodb`; added `firebase-admin` and `resend`.

---

## Step 1 — Get this code onto GitHub (repo: dgocostta/Foodlens-LP1)
From a terminal on your computer, inside your local clone of `Foodlens-LP1`,
copy these updated files/folders over your clone (or just copy the whole
`foodlens-lp1` folder contents), then:

    git add -A
    git commit -m "Switch backend to Firebase: Firestore leads, Storage uploads, Resend emails"
    git push origin main

(If you'd rather, you can also drag the changed files into the GitHub web UI.)
Changed/added files: `package.json`, `next.config.js`, `.env.local.example`,
`lib/firebase-admin.js`, `lib/email.js`, `app/api/[[...path]]/route.js`,
`app/onboarding/page.js`, `app/admin/page.js`.

## Step 2 — Enable Firebase Storage (2 minutes)
1. Firebase Console → your project → **Build → Storage → Get started**.
2. Accept the default rules for now (the server uses the Admin SDK, which
   bypasses rules; we'll tighten public rules later if needed).
3. Note the **bucket id** shown at the top, e.g. `your-project.firebasestorage.app`
   (older projects: `your-project.appspot.com`). You'll paste it as
   `FIREBASE_STORAGE_BUCKET` below.

## Step 3 — Point Vercel at the new repo (keeps demo.foodlensgroup.com)
In the **existing** Vercel project that serves demo.foodlensgroup.com:
1. **Settings → Git** → disconnect the current repo (`FoodLens-Demo-pages`) and
   **connect `dgocostta/Foodlens-LP1`** (branch `main`).
2. The domain stays attached to the project — nothing to move.

## Step 4 — Set environment variables in Vercel
Project → **Settings → Environment Variables** (Production + Preview).
Reuse the same values you already have in `demo-site/.env.local`:

| Variable | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | (same as demo-site) |
| `FIREBASE_CLIENT_EMAIL` | (same as demo-site) |
| `FIREBASE_PRIVATE_KEY` | (same as demo-site — paste full key incl. BEGIN/END; `\n` escapes are handled) |
| `FIREBASE_STORAGE_BUCKET` | the bucket id from Step 2 |
| `RESEND_API_KEY` | (same as demo-site) |
| `RESEND_FROM` | `FoodLens <noreply@send.foodlensgroup.com>` |
| `RESEND_REPLY_TO` | (same as demo-site, optional) |
| `LEAD_NOTIFICATION_TO` | `info@foodlensgroup.com` (where signup alerts go) |
| `ADMIN_KEY` | pick a strong secret — this unlocks /admin |

Then **Deployments → Redeploy** (or just push again).

## Step 5 — Verify
- Visit `https://demo.foodlensgroup.com` → submit the signup form.
  - You should get the internal email + the owner gets a welcome email.
  - The lead appears in **Firestore → `leads`**.
- On the onboarding screen, upload a dish photo → it lands in
  **Storage → `leads/<leadId>/...`** and the lead status flips to "Photos in".
- Open `https://demo.foodlensgroup.com/admin`, enter your `ADMIN_KEY`, and
  confirm the lead + photo thumbnail show up.

---

## Notes
- **Make the repo private again** whenever you like — Vercel stays authorized
  and keeps deploying. Do it after Step 5 passes.
- **Old flyer page**: we'll put it on `flyer.foodlensgroup.com` as a separate
  step (no code merge needed) once this is live.
- **Video automation**: data model + a stubbed endpoint are ready. When you pick
  a video tool, the TODO block in `app/api/[[...path]]/route.js` is where it goes.
- **Heads-up**: `next@14.2.3` has a published security advisory. Consider bumping
  to the latest 14.2.x patch (`npm i next@^14.2`) before or soon after launch.
