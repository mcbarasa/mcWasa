# McWaSa Updates

Kenyan gospel news feed with gigs and events near you, and poster-style blog posts from assigned writers.
Everything lives in one file: `index.html`. No installs, no build step.

## 1. Run it on your computer

**Easiest:** double-click `index.html`. It opens in your browser.

**Better (needed for "Use my location", which browsers only allow on http/https):**

```bash
cd mcwasa-updates
python3 -m http.server 8080
# open http://localhost:8080
```
No Python? Use `npx serve` (needs Node.js) instead.

## 2. Customise

Open `index.html` and edit the CONFIG block near the top of the `<script>`:

- `WRITERS`: the assigned writers, as `"Name": "passcode"`. Change these before you publish.
- `TOWNS`: add more towns with their latitude and longitude.
- `SEED_POSTS` and `SEED_EVENTS`: the sample content. Delete or replace them.
- Colours: the `:root` variables at the top of the CSS (`--green`, `--yellow`).

## 3. Deploy (free, about 5 minutes)

**Option A: Netlify Drop (no account setup needed to start)**
1. Go to https://app.netlify.com/drop
2. Drag the `mcwasa-updates` folder onto the page.
3. You get a live link. Rename it under Site settings.

**Option B: GitHub Pages**
1. Create a GitHub repository, for example `mcwasa-updates`, and upload `index.html` and `README.md`.
2. Go to Settings, then Pages. Under Source choose "Deploy from a branch", select `main` and `/ (root)`, then Save.
3. Your site appears at `https://YOUR-USERNAME.github.io/mcwasa-updates/` within a minute or two.

**Option C: Vercel**
1. Push the folder to GitHub, then import the repo at https://vercel.com/new.
2. Framework preset: Other. Click Deploy.

**Custom domain:** buy a domain (for example a .co.ke), then add it in Netlify, Vercel or GitHub Pages under Domains and follow the DNS steps they show.

## 4. Important: what this version can and cannot do

Posts and events that writers add are saved in **that browser only** (localStorage). That is fine for trying out the design, but other visitors will not see them, and the writer passcodes are visible to anyone who views the page source.

To make it a real shared site, add a backend. The simplest route:

1. Create a free project at https://supabase.com.
2. Make two tables, `posts` and `events`, matching the fields used in the code (`head, kick, theme, pts, body, author, date` and `title, type, artist, venue, town, date, time, price`).
3. Turn on Supabase Auth (email login) and create accounts for your assigned writers. Add a row-level rule so only signed-in writers can insert, while everyone can read.
4. Replace `store.get/set` and the sign-in code in `index.html` with Supabase calls.

I can build this version with you next.

## 5. Next upgrades

- Installable app (PWA) with a manifest and service worker
- Push or WhatsApp alerts for gigs near a visitor's town
- Download-poster-as-image button for sharing on WhatsApp and Instagram
- Admin approval step before a post goes live
