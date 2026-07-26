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

## Emergency: if Claude isn't available

Git and GitHub don't depend on Claude. Everything below works with or without AI help — this is the whole toolkit for keeping this project backed up and moving forward on your own.

**Save progress (do this often):**
```bash
git add -A
git commit -m "describe what changed"
git push
```
`add -A` stages everything except what's in `.gitignore`. `commit` snapshots it locally. `push` sends it to GitHub. Nothing goes up until you run all three.

**Check what's changed since your last commit:**
```bash
git status
```

**See your commit history:**
```bash
git log --oneline
```

**Undo to a previous commit (careful — this discards anything after it):**
```bash
git reset --hard <commit-hash>
```

**If `npm run dev` won't start:**
1. Confirm Postgres is actually running and `.env.local` has the right `DATABASE_URL`.
2. Delete `node_modules` and `.next`, then `npm install` again — fixes most dependency corruption.
3. Read the actual error in the terminal before changing anything; Next.js errors usually name the file and line.

**If a `git push` gets rejected for a large file:**
Almost always means something in `node_modules` or `.next` got committed before `.gitignore` existed. Fix:
```bash
git rm -r --cached node_modules
git rm -r --cached .next
git add -A
git commit -m "Remove build artifacts from tracking"
git push
```
If that still fails because the large file is buried in old commit history, the clean reset is:
```bash
Remove-Item -Recurse -Force .git   # PowerShell; use `rm -rf .git` on Mac/Linux
git init
git add -A
git commit -m "Clean commit"
git branch -M master
git remote add origin https://github.com/heredaniyal/networking-crm.git
git push -u origin master --force
```
This discards commit history, not your files — fine for a personal backup repo, not fine for a team repo with real history worth keeping.

**When genuinely stuck:** paste the exact error message (not a paraphrase) into a search engine or Stack Overflow. Git and Next.js are both extremely well-documented; the actual error text is almost always the fastest path to the fix.

## Known limitations / next steps

- No auth — this is a single-user personal tool, not something to deploy publicly as-is.
- No geocoding — area is a fixed dropdown/free-text field mapped to a hardcoded zone list, not a real address lookup. Fine for "which neighborhood," not fine for exact pins.
- Tags are stored as a Postgres `text[]` column, not a join table — simplest option for a personal contact count, would need normalizing if this grows into a real multi-user product.
