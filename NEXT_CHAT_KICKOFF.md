# Kickoff prompt — paste this into the new chat

You're picking up the FoodLens project in a fresh session. Follow these steps.

1) READ FIRST — open and read `AFFILIATE_CONSOLE_BRIEF.md` in:
   C:\Users\User\Documents\Claude\Projects\How to use Claude\FoodLens\foodlens-lp1
   It contains the full architecture, what's already built & live, env vars, known gotchas, the
   Phase-1 plan, and the branding/language rules. Obey the SCOPE banner at the top.

2) SCOPE — build **Phase 1 ONLY**: the code-based promoter/affiliate program (NO per-user logins).
   Do NOT build the full authed console — that's Phase 2 / a separate project (the Business Mission
   Control dashboard at C:\DEV\clients\Admin-Foodlens\...). Just Phase 1, in this repo.

3) BUILD ORDER (from the brief): Foundation (Firestore `affiliates` collection + API endpoints +
   Resend emails) → Admin "Affiliates" tab (approve → generate code → email) → Promoter landing+signup
   (`/join`) → code-gated Field Lead Intake (`/field`) → Affiliate Kit (`/field/kit`). Languages LAST.

4) Before writing any code, RESTATE the plan back to me and wait for my go-ahead.

PROJECT CONTEXT
- Repo: dgocostta/Foodlens-LP1 → Vercel → demo.foodlensgroup.com. Next.js 14.2.35 (App Router, JS),
  Tailwind 3, shadcn/ui, lucide-react. Backend: Firebase (Firestore + Storage via firebase-admin) +
  Resend. One catch-all API at app/api/[[...path]]/route.js. Admin gated by a shared ADMIN_KEY (env).
- Reuse existing patterns: the lead data model, the direct-to-Storage upload pipeline (lib/upload.js),
  the Resend email module (lib/email.js), the admin tab structure, and the <Logo> component.
- The affiliate CODE is the spam-guard + attribution ID; codes are generated on APPROVAL only.

BRANDING & STYLE (match demo.foodlensgroup.com)
- Dark (zinc-950 / zinc-50), orange accent (#ff5a1f / orange-500), gradient-orange highlight headings,
  glass navs, Inter font, mobile-first, keep overflow-x hidden.
- Logo: full lockup /foodlens-logo.png in nav/footer/hero via <Logo>; icon-only /foodlens-icon.png for
  favicon + tiny marks. Never stretch.
- DIFFERENTIATE surfaces: `/join` = marketing style (sell the affiliate idea); `/field`, `/field/kit`,
  and the Admin Affiliates tab = calmer DASHBOARD/app look with a subtle grid/dotted background and
  card+table layouts — same colors and logo, but visually distinct from the public brochure pages.

LANGUAGES (LAST — only after the builds work)
- Match foodlensgroup.com's language toggle (inspect that site and replicate it). Locales: English
  (default), Spanish, Portuguese-Portugal, Portuguese-Brazil, Ukrainian, Hindi / main Indian language(s).
  Persist the choice. Apply to public pages (/join, /field, /field/kit); admin stays English for now.

GOTCHAS (learned during the build)
- The mounted folder can TRUNCATE large file writes via the file tools / python open().write(). Write big
  files via bash `cat > file <<'EOF'` or cp from /tmp; if a file looks cut off, recover with
  `git show HEAD:path > /tmp/x` then cp back. Verify with `esbuild --loader:.js=jsx ... --outfile=/dev/null`.
- Full `next build` won't finish in this sandbox (SWC SIGBUS) — verify with esbuild parse; real builds run
  on Vercel.
- Vercel serverless request-body limit ~4.5MB → large uploads must use the direct-to-Storage signed-URL path.
- Going live = push to Foodlens-LP1 `main` (Vercel auto-deploys); the user/Chap runs the git push.

Begin by reading the brief and restating the Phase-1 plan.
