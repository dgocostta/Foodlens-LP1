# Kickoff prompt — ROADMAP / WORKFLOW MAPPING chat (paste into a new chat)

This chat is for VISUAL MAPPING and planning only — NOT building code. Use the Whimsical/diagram
connector (flowcharts + mind maps) to produce editable maps I can keep iterating.

## Context (read first)
Read these in C:\Users\User\Documents\Claude\Projects\Foodlens-backend\demo-foodlensgroup\foodlens-lp1 :
- AFFILIATE_CONSOLE_BRIEF.md  (full architecture, phases, branding, what's built)
- Affiliate_Bank_Blueprint.md (the affiliate resource-bank structure)

## What FoodLens is (one line)
Video menus for restaurants. Public funnel at demo.foodlensgroup.com (Next.js + Firebase + Resend,
Vercel). Phase-1 affiliate/promoter program is LIVE: /join (apply) -> admin approval -> emailed code ->
promote with the Kit -> leads via /field or /?ref= -> attribution + pipeline in /admin. No per-user
logins yet (the code is the key). Future: real auth + a separate "Business Mission Control" dashboard.

## Build me three maps (each its own editable board; restate the plan and confirm before generating)

1) RESTAURANT CUSTOMER JOURNEY (flowchart)
   QR/flyer -> demo.foodlensgroup.com -> signup form (restaurant, owner, email, dish photos) ->
   onboarding photo/video upload -> lead lands in /admin pipeline (new -> contacted -> photos_uploaded ->
   video_generating -> video_sent -> won/lost) -> we produce the video menu -> QR goes live on tables.
   Note the email touchpoints (welcome + internal notify) and the admin action at each stage.

2) AFFILIATE JOURNEY (flowchart)
   /join application -> "received" email + admin notify -> admin review/approve -> code generated +
   "approved/Founding Partner" email (code, top rate, Fast-Start, Kit link) -> affiliate promotes using
   the Kit (swipe copy with {{CODE}}/{{LINK}}) -> restaurant lead via /field (code gate) OR /?ref=CODE
   (homepage) -> lead tagged to affiliate, shows "Referred by" in admin -> commission tiers
   (1-10:20% / 11-20:30% / 21+:40%, recurring + retroactive) + bonuses (Founding lock-in, Fast-Start,
   Recruiter one-off, milestones). Show the recruiter sub-path (/join?ref=).

3) BUILD ROADMAP / MILESTONES (timeline or kanban-style map)
   - DONE: new LP on Firebase, logo, mini-CRM admin, uploads, deck, Phase-1 affiliate program.
   - NOW (small): email reply-to fix (monitored inbox, not noreply) + email logo image.
   - NEXT (one designed pass) "Affiliate Dashboard v2": profile-pic upload on /join, clickable admin
     card -> modal + quick actions, rename Kit -> "Affiliate Dashboard" with sidebar console nav,
     approval CTAs route to dashboard, gate restaurant signup behind basic training.
   - THEN: i18n (ES, PT-PT, PT-BR, UK, Hindi) on stable public pages — AFTER the dashboard restructure,
     not before. Match foodlensgroup.com's language toggle.
   - LATER: Phase 2 real Firebase Auth affiliate logins -> feeds the separate "Business Mission Control"
     dashboard (C:\DEV\clients\Admin-Foodlens\Foodlens_Dashboard_Mockup.html).
   - SEPARATE TRACK (compliance, deliberate): affiliate agreement + consent now; GDPR-safe ID/KYC
     collection only when designed properly.

## How to work
- Use the diagram connector to create each map as its own editable board/flowchart.
- Restate what you'll map and confirm with me before generating.
- Keep it editable and labeled; this is my single source of truth for product + ops workflows.
- Do NOT write app code here — this chat is planning/visual only.
