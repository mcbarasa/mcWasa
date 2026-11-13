# McWaSa Updates
Kenyan gospel news, gigs & events near you. Writers' studio, poster styles, search & filters, live updates, installable.
## Run locally
npm install, create `.env` (see `.env.example`), then `npm start` -> http://localhost:3000 (studio: /admin.html)
## Keep your data on Render (pick ONE)
A) Free: create a free Postgres database (Neon or Supabase) and set DATABASE_URL in Render > Environment. Posts AND photos are stored there.
B) Paid: attach a Render Disk mounted at /var/data and set DATA_DIR=/var/data.
Studio (admin) shows a red warning if storage is not permanent.
