# FoodLens — Product / roadmap notes (captured June 8, 2026)

Running record so ideas aren't lost between chats. Read alongside AFFILIATE_CONSOLE_BRIEF.md,
AFFILIATE_GAMIFICATION_VISION.md, and Affiliate_Bank_Copy_DRAFT.md.

## A. Affiliate Bank — content still to fill (file-drops + remaining copy)
The Bank structure + real swipe copy are live. Still to add (mostly Diego-produced media):
- **Video assets:** welcome video (Diego, 3 min), 90-sec demo + 3-min & 7-min demos, founder pitch (60s),
  5 customer testimonials, sample live menus, music/SFX pack.
- **Creatives & banners:** 5 display sizes (728×90, 300×250, 160×600, 320×50, 970×250), 4 social sizes
  (1:1, 9:16, 4:5, 16:9), email headers, logo/brand kit, editable Canva/Figma templates, before/after pairs.
- **Training:** "First Sale in 7 Days" 5-video mini-course, 30-day launch plan, recorded monthly calls, tools list.
- **Webinar kit:** white-label deck, 45-min script, registration + reminder + follow-up sequences.
- **Remaining copy:** reels 6–10, more TikToks, subject vault to 50, email sequences (nurture / re-engagement /
  seasonal), ROI calculator, comparison sheet, industry stats pack, case study deck, landing-page variations.
- **Two TODOs in policies:** full affiliate-agreement link, and payout cadence/method/minimum.
None of this blocks launch — affiliates can start with what's live.

## B. i18n / languages — DECISION: deferred (safe to add anytime)
- Batch 4 was i18n. **Deferred on purpose.** It's additive, isolated, and easy to spin up later; doing it now
  (while copy is still changing) would mean re-translating.
- Key scope reducer (Diego's insight): **only the diner-facing product menu needs translation — not the whole
  platform.** The diner menu is ALREADY multilingual at the product level (EN/ES/PT per the pricing page).
  The affiliate dashboard + Bank stay English (operators are fine in English).
- Public marketing pages (demo LP, /join) could be translated later IF entering non-English markets — low priority.
- **UPDATE June 9 — PT-BR now needed sooner:** Diego has a Brazilian affiliate ready who doesn't speak
  English well, so the public/affiliate surfaces of demo.foodlensgroup.com need Portuguese. Confirm scope:
  dashboard/instructions in PT (so the affiliate can operate), PT swipe copy (to pitch PT-speaking
  restaurants), or both — and PT-BR vs PT-PT. First real i18n trigger.
- **India expansion = a PRODUCT feature, not site i18n:** supporting Hindi, Tamil, etc. means expanding the
  languages the *menu translation engine* offers. That's separate from translating the affiliate site.

## C. Menu-photo AI intake — strong NEXT build candidate (ahead of i18n)
Idea (Diego): capture a photo of the restaurant's existing menu, then use AI to read it and auto-build their
digital menu — removing the biggest onboarding friction and creating a wow moment.
- **Capture** a menu photo at: demo LP lead form, /field affiliate intake, and onboarding. Reuse the existing
  direct-to-Storage upload pipeline (lib/upload.js); store under leads/<id>/menu/.
- **Extract:** server endpoint sends the image(s) to an OpenAI vision model → returns structured JSON
  (sections, items: name / description / price) → saved on the lead/restaurant record as a DRAFT.
- **Human review step (important):** the extraction is a draft the affiliate/owner confirms and edits — never
  auto-trust 100% (messy/handwritten/angled menus need review; multiple photos help).
- **Surface:** show the extracted menu in admin (and later the owner's account); owner picks which dishes to
  feature as videos.
- **Monetisation nudge:** dish count maps to plan (Starter 20 / Growth 50 / Premium unlimited) — frame as
  "your menu has 47 dishes → Growth fits you," helpful not coercive.
- **Integration boundary:** THIS repo can capture the photo, run the extraction, and store the structured menu
  on the lead. Pushing it into the real restaurant *product account* is a separate integration with the main
  foodlensgroup.com app — phase that last.
- **Suggested phasing:** (1) add menu-photo capture to the forms now (start collecting immediately, even before
  AI) → (2) wire OpenAI extraction + admin review → (3) integrate push to the product account.
- Cost is trivial at this scale; menu photos aren't personal data.
- Ready-to-paste build prompt for this is in QUEUED_BUILD_PROMPTS.md.

## D. Leads v2 (admin) — practical near-term batch (Diego's needs, June 8)
1. **Manual "Add lead" in ADMIN** — Diego has real leads he contacted BEFORE the build; he wants to load them
   as the first leads, credited to himself as an affiliate. Add an admin "Add lead" action that creates a lead
   and lets you set the affiliateCode (default Diego's own), so pre-existing contacts enter the pipeline
   attributed correctly. (Today leads can be added via /field?code=, but admin should be able to do it directly,
   in bulk-friendly fashion, without the training gate.)
2. **Photos optional at signup + add-later** — must be able to create a lead with NO dish photos (often there's
   no access at first), then add dish photos AND a menu photo later from the lead detail panel (received from
   owner, grabbed from their website, etc.). This overlaps with the menu-AI capture (section C) — same
   "add menu/photos to an existing lead" surface.
3. **Multi-location** — some leads are owners with 2–3 locations sharing the SAME menu. Model a `locations` list
   on the lead (name + area/address), with the menu shared across them.
   - DECIDED (June 8): **one account covers all the owner's locations** and counts as **ONE** venue toward
     affiliate commission tiers (not one per location). Model `locations` as a display list under the lead;
     commission is based on that single account's subscription. (Could add a multi-venue bonus later if wanted.)


## E2. Admin AI Assistant (spec: ADMIN_ASSISTANT_BUILD_PROMPT.md)
Agentic copilot in /admin for Diego + Patric. Claude API (ANTHROPIC_API_KEY), confirm-before-write, admin-only,
soul.md + memory.md (Hermes-style, scheduled reflection). Phase A = reactive copilot (query + a few safe writes,
email notify). Phase B = proactive alerts + reminders + WhatsApp (provider integration). Phase C = autonomy.
Build AFTER Lead Bank + the launch content.

## E3. Social media management dashboard — DECISION: don't build, use a tool
Diego wanted an in-admin dashboard to log into IG/FB/Threads/TikTok/LinkedIn/X/Pinterest and post. DECIDED
against building it: each platform needs its own OAuth + reviewed app + (Meta) business verification + Graph API
permission review + posting restrictions — effectively rebuilding Buffer/Metricool, months of compliance work,
not a differentiator. USE Metricool or Buffer (~EUR15-30/mo). Optional cheap add later: a lightweight
content-calendar view inside the Media tab (tracking only, no posting) + the AI assistant helps draft/organise.

## Build sequence (agreed)
1. Lead Bank Phase 1 (Claude Code, now) -> verify -> deploy.
2. Founding 100 launch content live (content chat + Higgsfield).
3. Admin AI Assistant Phase A.
4. Lead Bank Phase 2 (direct Apify in admin) + Assistant Phase B (proactive/WhatsApp).
5. i18n / PT when stable. Social = external tool throughout.
