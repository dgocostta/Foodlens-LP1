# FoodLens — Product-side Integration Requirements

**For:** the product developer (foodlensgroup.com app — Next.js 16 / React 19 / Prisma / NextAuth v4 / Stripe / EasyPanel-Docker)
**From:** Diego (marketing / lead / affiliate side — demo.foodlensgroup.com)
**Date:** June 9, 2026
**Priority:** as fast as is reasonable — we have restaurants and affiliates lined up.

## 1. Goal — a "share-funnel" onboarding (ClickFunnels model)
Our affiliates build a restaurant's full **video menu** on our side (menu scanned/typed, dishes + photos/videos
captured live at the venue). They share a link with the owner. The owner sees the **finished menu** (preview)
and the only way to use/manage it is to sign up to FoodLens. The share link sends them to a **checkout for that
specific menu** (plan pre-selected, menu pre-loaded) — NOT the generic choose-plan page. On payment, the menu is
bound to their new account and goes live. The owner claims a done product; they never "set it up."

The generic plans page stays as-is for cold/random visitors. This flow is for warm/hot leads our affiliates create.

## 2. End-to-end flow
1. Our side assembles the menu and **POSTs it to a product import endpoint** → product creates a **staged
   (unclaimed) restaurant + menu**, carrying the **affiliate code**. Returns a **preview URL** + **claim URL**.
2. Affiliate shares the **preview URL** with the owner (read-only; reuses existing `/menu/<id>` rendering).
3. Owner clicks **Claim / Use this menu** → the **claim URL** = a checkout bound to that staged menu, **plan
   pre-selected**, affiliate code carried through.
4. Owner registers (NextAuth) + pays (Stripe) in that flow.
5. **Stripe webhook → product binds the staged menu to the new account, activates it (goes live), and records
   the affiliate code.**
6. **Product calls our attribution webhook** to tell us the restaurant paid and which affiliate gets credit
   (and later: renewals / cancellations).

## 3. What we need built (product side)

### 3.1 Import / stage-menu API
Authenticated **service-to-service** endpoint (API key/secret in a header — not a user session).
`POST /api/integrations/staged-menus`
```jsonc
{
  "affiliateCode": "FL-MARIA-7G2",
  "suggestedPlan": { "tier": "premium", "interval": "yearly" },   // pre-select at checkout
  "sourceLeadId": "our-lead-id",                                   // for idempotent re-staging
  "restaurant": {
    "name": "The Exchange",
    "slogan": "Bar & Restaurant",
    "instagram": "@theexchange",
    "currency": "EUR",
    "logoUrl": "https://.../logo.png"
  },
  "categories": [ { "name": "Small Plates", "order": 1, "public": true } ],
  "dishes": [
    {
      "categoryName": "Small Plates",
      "translations": {
        "en": { "name": "...", "shortDescription": "...", "ingredients": "..." },
        "ptBR": { ... }, "ptPT": { ... }, "es": { ... }      // any may be omitted; product auto-translate can fill
      },
      "price": 15.50,
      "photoUrl": "https://.../dish.jpg",
      "videoUrl": "https://.../dish.mp4",                     // optional; only shows on video-enabled plans
      "extras": [ { "name": "Add chicken", "price": 4.00 } ],
      "bestSeller": false,
      "showInMenu": true
    }
  ]
}
```
- **Response:** `{ "stagedId": "...", "previewUrl": "...", "claimUrl": "..." }`
- **Media:** product should **pull the photo/video/logo from the provided URLs and re-host** in its own storage
  (our URLs are durable Firebase links). Confirm preferred approach (pull vs. we push files).
- **Idempotent:** re-POSTing with the same `sourceLeadId` (while still unclaimed) should **update** the staged
  menu, so affiliates can revise before the owner claims.
- **No owner account exists yet** at this point — the staged restaurant must be ownerless until claimed.

### 3.2 Staged-menu states + preview
- States: `unclaimed` → `claimed/active` (and ideally `expired` if never claimed after N days).
- **Preview URL**: public, read-only, reuses the existing menu rendering, with a banner like "Preview — claim to
  go live." Owner cannot manage/edit it.

### 3.3 Dedicated claim checkout
- `claimUrl` → checkout **bound to the staged menu**, with the **plan pre-selected** from `suggestedPlan` and the
  **affiliate code + stagedId carried as Stripe metadata**. Skips the generic choose-plan page.
- New owner signs up (NextAuth) and pays here. If they already have an account, allow login + attach.

### 3.4 Claim binding (Stripe webhook)
On `checkout.session.completed` / successful subscription:
- Create/activate the owner account, **bind `stagedId` → owner**, flip the menu to live (respect `showInMenu`).
- **Plan/limit handling:** if the staged menu has more dishes than the chosen plan allows, define the rule —
  recommended: keep all dishes but auto-hide the overflow until they upgrade (and surface "upgrade to show N more").
  Video-tagged dishes show only on video-enabled (Growth/Premium) plans.
- Store `affiliateCode` on the restaurant/subscription record.

### 3.5 Affiliate attribution callback  ★ CORE — currently missing
The product has no affiliate concept today. We need it to **report paid conversions and lifecycle events back to
us** so we can pay commissions (recurring, tiered, retroactive). On activation, renewal, and cancellation:
`POST {OUR_BASE_URL}/api/affiliate-conversions`  (HMAC-signed with a shared secret)
```jsonc
{
  "event": "activated" | "renewed" | "canceled" | "past_due",
  "affiliateCode": "FL-MARIA-7G2",
  "restaurantId": "prod-restaurant-id",
  "sourceLeadId": "our-lead-id",
  "plan": { "tier": "premium", "interval": "yearly" },
  "amount": 690.00, "currency": "EUR",
  "stripeCustomerId": "cus_...",
  "occurredAt": "2026-06-15T10:00:00Z"
}
```
- We provide the endpoint URL + shared secret. Retries on failure appreciated.

## 4. Security
- Import endpoint: service API key/secret (header), rate-limited.
- Attribution callback: HMAC signature over the body with a shared secret.
- Claim checkout must reject an already-claimed `stagedId`.

## 5. What our side provides / owns
- The build UI, menu assembly, and media (durable Firebase URLs).
- The affiliate code + suggested plan on every staged menu.
- The `/api/affiliate-conversions` receiver + the shared secret.
- We consume `previewUrl` / `claimUrl` and surface them to affiliates/owners.

## 6. Open questions for the developer
1. Is there an existing **admin/internal API** we can build on, or is all data access owner-session only today?
2. **Media:** can the product pull/re-host from external URLs, or do you want us to push files? Size limits?
3. **Stripe:** confirm Checkout can pre-select a plan + carry `affiliateCode`/`stagedId` in metadata.
4. **Ownerless restaurant:** can a restaurant + menu exist with no owner user, then be bound on claim? Any model changes needed?
5. **Dish-limit rule** on claim when the menu exceeds the chosen plan — agree the behavior (recommend hide-overflow).
6. Anything here that conflicts with how the current Prisma schema / NextAuth ownership is modeled.

## 7. Suggested build order (so we can start integrating early)
1. **Import API** (3.1) + staged-menu model & preview (3.2) — unlocks us building + showing menus immediately.
2. **Dedicated checkout + claim binding** (3.3–3.4) — turns previews into paying, live accounts.
3. **Affiliate attribution callback** (3.5) — so commissions are tracked from the first paid conversion. (Can land
   alongside #2; must not be skipped.)

We'll align our side (export package format + the conversion receiver) to whatever shapes are easiest for you —
these are a starting point, not fixed contracts.
