# FoodLens — Affiliate Activation & Gamification Vision

Captured June 8, 2026. This is the product direction for the affiliate dashboard beyond
basic Phase-1. It guides Batch 3 (building now) and the batches after it. Read alongside
`AFFILIATE_CONSOLE_BRIEF.md` and `Affiliate_Bank_Blueprint.md`.

## Core idea
Turn the affiliate dashboard from a page they *read* into a workspace they *work in* — a
guided bootcamp that teaches a new promoter how to become a great affiliate, keeps their work
on-platform, and gives Diego a real engagement signal (no time-wasters).

## Design principles (apply to everything below)
1. **Progress-based, never calendar-based.** Unlock the next thing the moment a task is done.
   The "Day 1 / Day 2 …" labels are a *suggested order*, not time locks. A high achiever can
   finish everything in an hour and be fully unlocked; a slower person follows the same path at
   their own pace. No scheduled drip.
2. **Completion must be earned, not declared.** Where a task has an artifact, derive completion
   from the artifact (e.g. "list 20 target restaurants" completes when the Workbook holds 20),
   not from a cheap "mark complete" button. Tasks with no artifact (watch video, read policies)
   stay a manual check.
3. **Keep the work on-platform.** Give them the tools to do the task here (Workbook, notes) so
   nothing leaks to a paper notebook Diego can't see — and so the system can hold accountability data.
4. **Reward the right thing.** Small badges/tokens for finishing training = momentum. The *real*
   rewards (cash bonuses, commission bumps) sit on **paying restaurants signed**, never on busywork —
   otherwise people farm points instead of selling. Always keep the one number that matters visible:
   paying restaurants referred.
5. **Tokens must mean something.** Tie any internal token/badge to real standing — leaderboard rank,
   early feature access, the path to the 40% founding lock-in — or they feel hollow.

## Rank progression (the "bootcamp" metaphor)
Ranks are **derived from existing data**, not a separate system to build:
- **Promoter (in training)** — approved, 0 paying restaurants signed.
- **Affiliate** — has signed >= 1 paying restaurant.
- **Founding Partner** — reached the 40% commission tier, or is in the first-50 founding lock-in.

Rank thresholds live in `lib/affiliate-program.js` next to the commission tiers. Shown as a
read-only badge on the dashboard now; can drive perks/unlocks later.

## BUILD NOW — Batch 3 (Affiliate Activation Workspace)
1. Admin affiliate **card quick actions** (Approve/Resume, Send link, Copy code) inline on the card,
   not only in the modal. (Fixes the Batch-2 miss.)
2. Persistent **checklist sidebar** on the dashboard — the quick-start split into individual tickable
   tasks; state persists on the affiliate record keyed by the validated code (`checklist` map).
   Progress-based unlock replaces the single "mark complete" button.
3. **Workbook tab** — "Target Restaurants" list (name, area/notes, status: to_contact | contacted |
   pitched | signed) + free-text notes, persisted per affiliate.
4. **Evidence-based completion** for tasks that have an artifact (e.g. workbook count).
5. Admin **accountability view** — checklist progress ("4/7 done") + workbook counts in the affiliate
   modal; the no-show signal.
6. **Rank badge** (derived, read-only) at the top of the dashboard.

### Future-proofing baked into Batch 3 (structure only)
- Every task completion and every signup logged as a discrete, timestamped event, so points/badges/
  leaderboard attach later with no migration.
- Workbook restaurants kept linkable to real leads by code (statuses can auto-sync later).
- Rank thresholds in `lib/affiliate-program.js`, not inline.

## LATER (deferred — do NOT build yet)
- **Token / badge economy** — per-task badges for momentum, bigger rewards on paying signups.
- **Leaderboard & contests** (blueprint section 10) — needs the event log above + ideally Phase-2 logins.
- **Daily / triggered email nudges** via Resend, tied to checklist state ("you're on Day 3, here are
  today's 3 actions") — triggered by progress, not a calendar.
- **AI assistant** — an in-dashboard coach (IDE-assistant style) that answers questions, drafts DMs with
  the affiliate's code pre-filled, and reviews their pitch. Needs an LLM endpoint; its own piece of work.
- **Phase-2 real logins** (Firebase Auth) — makes all per-affiliate data secure + multi-device and
  unlocks the leaderboard/contests cleanly.

## The full cockpit vision (captured June 8, 2026 — build in slices, most need Phase-2 auth)
Goal: the affiliate opens the dashboard and has everything to reach, follow, track, schedule, and ask
for help — zero reason to leave the page. "Endoctrinate" new affiliates into the FoodLens way of working.

Modules to add (rough priority):
- **Home scorecard** — signed count, pipeline, rank + progress to next commission tier ("3 more venues to
  30%"), founding status. All derived from existing data. (Fills the empty Home space; no auth needed.)
- **My Leads** — affiliate sees their own referred leads + statuses as a dynamic block (today only admin
  sees them). Read view filtered by code. HIGHEST near-term value; no auth needed.
- **One-click links + QR generator** — their ?ref= link + downloadable QR. Trivial, big friction win.
- **Milestones / roadmap timeline** — visual progression (recruit -> first signup -> tiers -> Founding
  Partner). Derived from rank/signed data.
- **Lead assignment** — admin can assign leads for an affiliate to "look after" (a 2nd relationship beyond
  "referred by"); affiliate sees assigned + referred. Needs auth to be safe.
- **Calendar** — affiliate tracks their own meetings/events; ideally connect Google Calendar later. Needs auth.
- **Support tickets** — in-dashboard form -> `tickets` collection + emails Diego (reuse Resend) -> he replies.
- **AI helper** (right sidebar) — consult-anytime coach: answers questions, drafts DMs with their code
  pre-filled, reviews pitches. Needs an LLM endpoint.
- **Per-restaurant action plan (Diego's idea, a keeper):** from a materials section (Emails, Social, etc.)
  an "Add to a restaurant" button attaches that asset to a Workbook restaurant. Opening that restaurant
  then shows its action plan — what to email/post for that specific venue. Turns the Workbook from a list
  into a real per-venue playbook. Build after My Leads.

### Design critiques of the current dashboard (from the June 8 screenshots)
- **Naming conflict:** Home program card says "Your program — Founding Partner" while the rank badge says
  "Promoter." Reads contradictory. Either rename the card to "Commission program" / "Founding Partner
  Program" (a program name, not their rank) or otherwise separate program-name from earned-rank clearly.
- **Home is mostly empty** below the program card — that's exactly where the scorecard + My Leads snapshot +
  next-action should live. Right now Home shows static program info, not "how am I doing?"
- **Left nav will get crowded** (Home, Workbook, 00–11 = 14 items). As modules are added, group into
  "Workspace" (Home, My Leads, Workbook, Calendar) vs "Resource Library" (00–11).
- Quick-start staying bottom-left as a completed accountability record is fine; the right sidebar is
  reserved for the helper/consult space (and eventually the AI coach).

NOTE: everything built here is reused inside the future Master/Business Console — nothing is thrown away.
The cockpit is the trigger to prioritise Phase-2 auth, so sensitive per-affiliate data isn't sitting
behind a shareable ?code= URL.

## i18n
Still last in the queue, after the workspace is stable. Match foodlensgroup.com's language toggle.
