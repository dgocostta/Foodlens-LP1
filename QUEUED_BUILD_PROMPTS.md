# Queued build prompts (ready to paste into the build chat when you pick the work back up)

Context lives in PRODUCT_ROADMAP_NOTES.md. Each prompt assumes: read AFFILIATE_CONSOLE_BRIEF.md first,
restate the plan and wait for go-ahead, file-tools-safe writes (cat > / full read-back, esbuild parse,
Vercel build as backstop), and NO git push from the build chat (Diego/Chap push). Repo:
C:\Users\User\Documents\Claude\Projects\Foodlens-backend\demo-foodlensgroup\foodlens-lp1.

---

## QUEUED — Menu-photo AI intake (capture → AI extract → review → account)

```
Menu-photo AI intake. Read AFFILIATE_CONSOLE_BRIEF.md + PRODUCT_ROADMAP_NOTES.md (section C) first, then
RESTATE the plan and wait for my go-ahead. Build in phases; Phase 1 is the actionable part now.

GOAL: capture a photo of a restaurant's existing menu, use AI to read it into structured items, and prefill
the restaurant's menu — removing manual entry and creating a wow moment. The dish count also nudges the plan
tier (Starter 20 / Growth 50 / Premium unlimited).

PHASE 1 — CAPTURE (build now):
- Add an optional "menu photo(s)" upload to: the demo LP lead form (app/page.js), the affiliate field intake
  (app/field/page.js), and onboarding (app/onboarding/page.js). Allow multiple images.
- Reuse the existing direct-to-Storage signed-upload pipeline (lib/upload.js); store under leads/<id>/menu/.
- Save the menu image refs on the lead doc (e.g. menuPhotos: [{path,name,...}]). Surface them in the admin
  lead detail panel (app/admin/page.js) with a thumbnail + "add menu photo" action on existing leads.
- This must NOT block lead creation — capturing a menu photo is always optional.

PHASE 2 — AI EXTRACT (after Phase 1, separate pass):
- Add a server endpoint (extend app/api/[[...path]]/route.js) that sends the menu image(s) to an OpenAI
  vision model and returns structured JSON: { sections:[{name, items:[{name, description, price}]}] }.
  Use an OPENAI_API_KEY env var (add to Vercel). Keep the call server-side.
- Save the result as a DRAFT on the lead (menuExtract: {..., status:'draft'}). Do NOT auto-apply.
- In admin, show the extracted menu with an editable review UI (confirm/fix items) before anything is used.
  Show the dish count and the suggested plan tier (helpful framing, not forced).

PHASE 3 — PUSH TO PRODUCT ACCOUNT (last; separate integration):
- Pushing the confirmed menu into the real restaurant account lives in the main foodlensgroup.com app, not
  this repo. Leave a clear seam (the confirmed menu JSON on the lead) for that integration. Don't build the
  push here unless told the integration target.

CONSTRAINTS: reuse upload pipeline + admin patterns; menu photos optional everywhere; never block signup;
human review before trusting AI output. No push — give me the commit command + test checklist when ready.
Start by reading the brief + notes and restating the Phase-1 plan.
```

---

## QUEUED — Leads v2 (admin manual add, photos-optional/add-later, multi-location)

```
Leads v2. Read AFFILIATE_CONSOLE_BRIEF.md + PRODUCT_ROADMAP_NOTES.md (section D) first, then RESTATE the
plan and wait for my go-ahead. Repo: C:\Users\User\Documents\Claude\Projects\Foodlens-backend\demo-foodlensgroup\foodlens-lp1.

1) ADMIN "ADD LEAD" (manual entry). In app/admin/page.js add an "Add lead" action (in the Leads tab) that
   creates a lead via the API with: restaurant name, owner, contact (email/phone/instagram), notes, status,
   and an editable `affiliateCode` that DEFAULTS to Diego's own code (so pre-build leads he already contacted
   enter the pipeline credited to him as the affiliate). No training gate for admin. Set source:'admin'.
   Extend the catch-all API (app/api/[[...path]]/route.js) if a dedicated admin create path is cleaner;
   reuse the existing lead model + "Referred by" wiring so these show attributed correctly.

2) PHOTOS OPTIONAL + ADD-LATER. Lead creation must work with ZERO dish photos. In the admin lead detail
   panel, add the ability to upload/attach dish photos AND a menu photo to an EXISTING lead later (reuse the
   direct-to-Storage pipeline, lib/upload.js; store under leads/<id>/...). This is the same surface the
   menu-AI capture will use — keep it compatible (a menuPhotos field on the lead).

3) MULTI-LOCATION. Add a `locations` list to the lead: each entry = name + area/address, all sharing ONE
   menu. Show/edit it in the lead detail. DECIDED: one account covers all locations and counts as ONE venue
   toward commission tiers (do NOT multiply tier count by locations). Locations are informational + for the
   owner's record.

CONSTRAINTS: reuse existing lead model, admin tab/detail patterns, upload pipeline, attribution wiring.
File-tools-safe writes (cat>/read-back/esbuild), Vercel build as backstop. No push — give me the commit
command + test checklist when ready. Start by reading the brief + notes and restating the plan.
```

---

## MENU-AI PHASE 2 — locked setup, prompt & schema (use when building extraction)

### OpenAI setup (Diego, done outside code)
- No "app" to create — just an API key. Recommended: create a **Project "FoodLens"** on platform.openai.com,
  generate the key INSIDE that project, and set a **monthly spend cap** under Billing/Limits (safety only —
  cost is ~a fifth of a cent per menu on gpt-4o-mini, a few cents on gpt-4o).
- Store the key in **Vercel as OPENAI_API_KEY** (Production + Preview). NEVER commit it or put it in the repo;
  the call is server-side only. The key is generic — the "menu extraction" behaviour is 100% in the prompt below.

### Request settings
- Model: start with **gpt-4o-mini**; fall back to **gpt-4o** if real menus come back sloppy.
- **temperature: 0**, image **detail: high**, use **structured outputs (response_format json_schema)** with the schema below.
- **MULTI-PAGE:** send ALL page images in ONE request (attach the 3–4 page photos to the same message). The
  model merges them into one categorized menu and de-duplicates repeats across pages. If the menu is a PDF,
  render each page to an image first, then attach. (Capture already allows multiple images per lead.)
- Save the result as a DRAFT on the lead: `menuExtract: { sections, currency, model, createdAt, status:'draft' }`.
  NEVER auto-apply. Admin/owner reviews + edits before use. Show dish count + suggested plan tier (helpful, not forced).
- Prompt the model to extract only what's visible (anti-hallucination — already in the system prompt).

### System prompt (send on every call)
```
You are a precise menu digitizer for FoodLens. You receive one or more photos or scans of a restaurant's
existing menu. Transcribe it into structured data — exactly as printed, nothing added.
Rules:
- Extract ONLY what is visibly on the menu. Never invent, guess, or "complete" a dish, description, or price
  that isn't clearly shown.
- Keep item names and descriptions in their ORIGINAL language, exactly as written. Do not translate, reword,
  or fix spelling.
- Group items under the section headings shown on the menu (Starters, Mains, Desserts, Drinks, Specials,
  etc.). If an item has no visible section, use "Uncategorized".
- Capture the price as written plus the currency (e.g. €, EUR). If an item lists several sizes/prices, return
  each as a separate variant with its label. If a price is missing or unreadable, set it to null — do not guess.
- Preserve dietary markers if shown (V, VG, GF, spicy, etc.) in tags.
- If the same item appears in more than one image, include it once (de-duplicate).
- If text is too blurry or cut off to read confidently, include your best transcription and set needs_review
  to true for that item.
- Return only the structured data. No commentary.
```

### JSON schema (structured outputs)
```
menu:
  currency: string | null
  sections: [
    { name: string,
      items: [
        { name: string,
          description: string | null,
          variants: [ { label: string | null, price: number | null } ],
          tags: [ string ],
          needs_review: boolean } ] } ]
```

### User message per call
"Restaurant: {name}, {city}. Extract all items from the attached menu." + all page images at detail:high.
