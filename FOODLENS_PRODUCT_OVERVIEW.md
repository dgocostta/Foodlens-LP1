# FoodLens Product (foodlensgroup.com) — Build & Architecture Overview

Documentation of the **existing product app** — the system Patric commissioned from an external developer.
Diego's workstream (the marketing / lead / affiliate / onboarding side at demo.foodlensgroup.com) is separate
and must integrate with this. Observed June 9, 2026 via a logged-in restaurant account ("The Boss", Starter plan).

## What it is
A multi-tenant **restaurant digital-menu SaaS**. A diner scans a QR code at the table and views the
restaurant's menu (photos, optional videos, multilingual). Each restaurant owner has an account and manages
their own menu. Billing is subscription-based via Stripe, tiered by plan.

## Tech stack (per Patric's developer)
- **Next.js 16**, **React 19**, **Radix UI**, **Tailwind CSS 4** (front end)
- **Prisma** ORM (so a relational DB behind it — likely Postgres)
- **NextAuth v4** (authentication — owner accounts)
- **Stripe** (subscriptions / billing)
- Hosted on **EasyPanel + Docker (Nixpacks build)**
- Built by an external dev (reachable / willing to take requirements).

## Owner dashboard (`/restaurant`) — four tabs
**Profile** — owner's personal/contact info: Full name, Email, Phone, Country, City; Preferred email language
(English / Português-BR / Português-PT / Español); current plan; account-security note.

**Info (Visual Identity)** — restaurant brand + menu settings: Logo upload, Establishment Name, Brand Slogan
(+ translate), Instagram handle, Currency (€ EUR), **Dietary Filters / smart tags** (e.g. Vegan, Gluten-Free),
and the **QR code + public menu link** (downloadable table QR).

**Categories** — named menu segments (observed: Sushi, Burgers, Breakfast, Coffee Shop, Beverages). Each has a
visibility state (Public) + Live status + an item count. "Create Category."

**Dishes** — per dish:
- **Name, Short Description (≤150 chars), Ingredients** — each in **English, Português (BR), Português (PT),
  Español**, with an **"Auto Translate All"** button.
- **Price**, **Category**.
- **Dish Photo** (upload).
- **Dish Video** — gated **PRO** (requires a higher plan: "upgrade to bring your menu to life with videos").
- **Extras / Add-ons** (e.g. "add chicken €4").
- **Best Seller** toggle, **Show in Menu** (visible to customers) toggle.
- **Plan-based dish limit** (Starter = 20 dishes).

## Plans & billing
- Starter €12 / Growth €39 (most popular) / Premium €69 per month (from the public choose-plan page);
  monthly / quarterly (−11%) / yearly (−17% = 2 months free).
- Billing via **Stripe** ("Manage Subscription"). A separate **"Courtesy"** date exists (comp/free access
  independent of Stripe). **Video is gated to paid/higher plans.** Dish limits scale by plan.

## Public surface
- Public digital menu at `/menu/<restaurantId>` + a downloadable **table QR code**.
- Menu content + owner emails support EN / PT-BR / PT-PT / ES (with auto-translate).

## Observations relevant to our integration (build-live-then-claim onboarding)
- **No bulk import / public API surfaced in the owner dashboard** — dishes are created one-by-one via the UI.
  To auto-populate a menu from our side, the product needs an authenticated import endpoint. (Confirm with the
  dev whether any admin panel / internal API already exists that wasn't visible from the owner view.)
- **Account model is owner-authenticated (NextAuth)** — there's no visible concept of a *pre-provisioned*
  restaurant/menu that exists before an owner registers and pays, then gets *claimed*. That "claim" flow is
  new product-side work.
- **Media is stored product-side** — our captured dish photos/videos (in Firebase) would need to be ingested
  by the product on import (via URLs it pulls, or a file transfer).
- **Good news — strong data-model alignment:** our menu-scan output maps almost 1:1 (our sections → categories,
  items → dishes, ingredient line → Ingredients, "add X" → Extras, featured → Best Seller, visible → Show in
  Menu). And the product already handles PT-BR + auto-translate, so the diner menu is multilingual without our
  involvement.
