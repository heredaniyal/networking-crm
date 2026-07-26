# Networking CRM

Map and manage contacts by location. Built with Next.js (App Router), PostgreSQL, and Leaflet — matches the stack listed on the resume entry for "Networking CRM System."

## Stack

- Next.js 14 (App Router, API routes)
- PostgreSQL via `pg`
- Leaflet + react-leaflet for the map
- No ORM — raw SQL, so the query logic is visible and easy to explain in an interview

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Postgres database and load the schema:
   ```bash
   createdb networking_crm
   psql networking_crm -f schema.sql
   ```

3. Copy the env template and point it at your database:
   ```bash
   cp .env.example .env.local
   # edit .env.local with your real DATABASE_URL
   ```

4. Run it:
   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## How it works

- **Map tab** — every Lahore neighborhood in `lib/zones.js` is a fixed lat/lng center. Pin size and opacity scale with how many contacts are tagged to that area. Click a pin to filter the contact list below the map. Coordinates are approximate neighborhood centers, not exact addresses — nudge them in `lib/zones.js` if a pin lands somewhere annoying.
- **Directory tab** — full list, editable inline. Assigning `area` to a contact is what makes them show up on the map; city + area are separate fields, so contacts outside Lahore just show up in the "other cities" list instead of on the map.
- **Add / import tab** — paste a Google Contacts CSV export, preview the parse, then bulk-insert. Manual add for one-off contacts.
- **API routes** (`app/api/contacts`) — `GET` list, `POST` create one, `PUT` bulk-create (used by the CSV importer), and `app/api/contacts/[id]` for `PATCH`/`DELETE`.

## Known limitations / next steps

- No auth — this is a single-user personal tool, not something to deploy publicly as-is.
- No geocoding — area is a fixed dropdown/free-text field mapped to a hardcoded zone list, not a real address lookup. Fine for "which neighborhood," not fine for exact pins.
- Tags are stored as a Postgres `text[]` column, not a join table — simplest option for a personal contact count, would need normalizing if this grows into a real multi-user product.
