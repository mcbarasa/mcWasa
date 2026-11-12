# McWaSa Updates
Kenyan gospel news, gigs & events near you. Writers' studio with image uploads, poster styles, search & filters. Installable (PWA).
## Run locally
npm install, create `.env` (see `.env.example`), then `npm start` -> http://localhost:3000 (studio: /admin.html)
## Deploy on Render
Push to GitHub, then Render > New > Blueprint (uses render.yaml) and set ADMIN_PASSWORD. Posts + images live on the disk at /var/data - keep the disk attached.
