# Build: Lead Bank (admin) — Phase 1

Feature for the admin at demo.foodlensgroup.com/admin. Build in this repo (Next.js 14.2.35, App Router, JS;
Firebase via firebase-admin; catch-all API at `app/api/[[...path]]/route.js`; admin gated by `ADMIN_KEY`;
admin UI in `app/admin/page.js` with tabs Leads / Media / Affiliates). **Match the existing admin dark
charcoal theme — NOT the blue of the standalone dashboard.**

## What it is
A pool of COLD, scraped restaurant prospects (separate from real inbound `leads`), browsable, filterable,
labelable, and **bulk-assignable to affiliates**. Fed by a scheduled Cowork scraper chat (pushes via API),
plus CSV/JSON upload and manual add. Scales to many cities/countries.

## Data model — new Firestore collection `leadBank`
Doc id = `placeId` (Google Place ID — natural dedupe key; upsert on it). Fields mirror the scrape:
`restaurant, cuisine, cuisineGroup, serviceType, dineIn, takeaway, delivery, price, rating, reviews, phone,
website, email, instagram, facebook, area, address, googleMaps, placeId`
Plus CRM/system fields:
`status` (new | contacted | interested | not_interested | converted; default "new"),
`assignedTo` (affiliate code or null), `assignedName`, `assignedAt`, `notes`, `lastContacted`, `nextFollowup`,
`batchId`, `source`, `city`, `country`, `importedAt`, `createdAt`, `updatedAt`.
Keep `status` (outreach state) INDEPENDENT of `assignedTo` (ownership).

## API (extend the catch-all `app/api/[[...path]]/route.js`; all admin routes require the ADMIN_KEY header)
- `POST /api/lead-bank/import` — bulk **upsert** by placeId. Body: `{ batch:{source,city,country}, leads:[...] }`.
  Generates a `batchId`; new docs get `status:"new"`, `importedAt`. **On duplicate placeId: update contact/
  info fields but PRESERVE existing `status`, `assignedTo`, `notes`** (never clobber manual work). Returns
  `{ batchId, inserted, updated }`. This is the endpoint the scraper chat + CSV upload both call.
- `GET /api/lead-bank` — list with filters (country, city, cuisine, cuisineGroup, area, status, assigned/
  unassigned, ratingMin, batchId, search across name/address) + **pagination** (2k+ rows — limit + cursor).
  Return counts for KPIs.
- `PATCH /api/lead-bank/:id` — update one (status, notes, assignedTo, lastContacted, nextFollowup, etc.).
- `POST /api/lead-bank/bulk` — bulk action on `{ ids:[...] }` OR `{ filter:{...} }` (select-all-in-filter):
  `action: 'assign' | 'status' | 'delete'`, plus `value`. Bulk assign sets assignedTo+assignedName+assignedAt.
- `GET /api/lead-bank/assigned?code=` — affiliate-facing: validates the code (reuse affiliate validate), returns
  leadBank docs where `assignedTo == code`. Used by the affiliate "Assigned to me" view.

## Admin UI — new "Lead Bank" tab (in `app/admin/page.js`)
- **Left rail:** Country → City nav (Dublin now; built to add more), + filters: cuisine, area, status,
  assigned/unassigned, rating, and a **batch filter** ("show newest import" / by batchId), + search box.
- **KPI strip:** total, new, assigned, by city.
- **Table (dense, dark charcoal):** checkbox, Restaurant, Cuisine, Area, Rating/Reviews, Phone, Website,
  Status, Assigned To, Last Contacted. Row → detail drawer with all fields, editable status/notes/owner, and
  quick-action links (tel:, mailto:, website, Google Maps).
- **Multi-select + select-all-in-filter → bulk toolbar:** **Assign to affiliate** (dropdown of APPROVED
  affiliates — reuse the affiliates list), Set status/label, Delete. (No pre-assignment — Diego picks the
  affiliate at assign time.)
- **Import panel:** drag-drop CSV/JSON (Apify export or the xlsx-derived CSV) → auto-map the known headers
  (see mapping below) → preview → dedupe on placeId → insert with a batch label (source + city + country +
  date). Plus a manual "Add prospect" form.

### CSV/xlsx header → field mapping (auto-map these)
`Restaurant→restaurant, Cuisine→cuisine, Cuisine Group→cuisineGroup, Service Type→serviceType,
Dine-in→dineIn, Takeaway→takeaway, Delivery→delivery, Price→price, Rating→rating, Reviews→reviews,
Phone→phone, Website→website, Email→email, Instagram→instagram, Facebook→facebook, Area / District→area,
Address→address, Google Maps→googleMaps, Status→status, Owner→assignedName, Last Contacted→lastContacted,
Next Follow-up→nextFollowup, Notes→notes, placeId→placeId`

## Affiliate-facing "Assigned to me" (in the affiliate dashboard — `app/field/kit/page.js` or `/field`)
A section/tab "My leads to contact" that calls `GET /api/lead-bank/assigned?code=<their code>` and lists their
assigned prospects. Basic work actions: mark contacted, add a note, mark not_interested / converted (PATCH by
code — validate the code owns the record). Reuse the existing code-based affiliate access (no new auth).

## Ingestion loop (how data arrives)
- The scheduled **Cowork scraper chat** POSTs cleaned scraped leads to `POST /api/lead-bank/import` with the
  `ADMIN_KEY` header (see APIFY_SCRAPER_GUIDE.md for the actor + the exact POST body). No manual download/upload.
- CSV/JSON upload in admin and manual add call the same import/insert path.
- (Phase 2, later) a "Run scrape" form in admin that calls the Apify API directly.

## Constraints / notes
- Reuse firebase-admin, the ADMIN_KEY gate, and the existing admin tab/detail patterns. Dark charcoal theme.
- Performance: 2,000+ rows — paginate, and expect to create Firestore **composite indexes** for multi-field
  filters (Firestore will auto-suggest the create-index links on first query; note this in the PR).
- Never overwrite manual work on re-import (preserve status/assignedTo/notes on duplicate placeId).
- Verify the build (`next build` / lint) before handing back a commit. Deploy is git push → Vercel (Diego runs it).
```
