# Apify Scraper → Lead Bank — setup guide

Goal: a scheduled scraper (run from a Cowork chat) that fills the admin Lead Bank automatically, per city,
with contact details, pushing straight into `POST /api/lead-bank/import`.

## Recommended actor
Your current data came from a Google Maps + website crawl but was missing email/socials on many rows. Use an
actor that enriches contacts:
- **`lukaskrivka/google-maps-with-contact-details`** (Google Maps scraper + email/phone/social enrichment).
  Alternative base: `compass/crawler-google-places` (a.k.a. Google Maps Extractor) if you don't need contacts.
- These return a **`placeId`** per venue — our dedupe key — plus name, category, address, phone, website,
  rating, reviews, and (with the contact actor) email + social profiles.

## Example actor input (per city)
```json
{
  "searchStringsArray": ["restaurants", "cafes", "bistros"],
  "locationQuery": "Dublin 2, Ireland",
  "maxCrawledPlacesPerSearch": 300,
  "language": "en",
  "scrapeContacts": true,
  "skipClosedPlaces": true
}
```
Run one config per area/city (Dublin 1, Dublin 2, …), or per city as you expand (Edinburgh, Lisbon…). Tag each
run with the city so the import batch is labelled correctly.

## Field mapping (actor output → import payload)
`title→restaurant, categoryName→cuisine, address→address, city/neighborhood→area, phone→phone,
website→website, email(s)→email, instagram/facebook→instagram/facebook, totalScore→rating,
reviewsCount→reviews, price→price, placeId→placeId, url→googleMaps`.
(Cuisine Group / Service Type / Dine-in etc. can be derived or left blank — optional.)

## Push to the Lead Bank (what the scraper chat does)
After the run, map the dataset and POST to the admin import endpoint:
```
POST https://demo.foodlensgroup.com/api/lead-bank/import
Header:  x-admin-key: <ADMIN_KEY>     (same admin key as /admin)
Body:
{
  "batch": { "source": "apify-gmaps", "city": "Dublin", "country": "Ireland" },
  "leads": [ { "restaurant": "...", "placeId": "ChIJ...", "cuisine": "...", "area": "Dublin 2",
               "phone": "...", "website": "...", "email": "...", "rating": 4.3, "reviews": 210,
               "address": "...", "instagram": "...", "facebook": "...", "googleMaps": "..." }, ... ]
}
```
The import upserts by `placeId`, stamps a fresh `batchId` + `status:"new"`, and preserves any existing
status/assignment/notes on venues already in the bank. New rows show up in admin filtered by "new" / newest batch.

## Scheduling
Run the scraper chat on a schedule (a new city/area each run). Every run auto-populates the bank with a fresh
"new" batch for you and Patric to browse and assign. No manual downloads.

## Cost note
Apify bills by usage (compute units + results). Scraping a few hundred venues per city is cheap; running many
cities adds up — watch your Apify plan usage as you scale. `scrapeContacts:true` costs a bit more per result
but fills the email/socials you were missing.
