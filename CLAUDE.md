# Manifest — Life OS

Jacob Petersen's personal Life OS. Replaces Apple Notes and Reminders entirely.
Will eventually be integrated into the higrade-invoicing app.

## Stack
- Vite + React (single-page app)
- Supabase Postgres (no RLS yet — add when integrating with invoicing app)
- Vercel (auto-deploys on push to main)

## Env vars
Copy `.env.example` to `.env.local` and fill in:
- `VITE_SUPABASE_URL` — from Supabase project settings
- `VITE_SUPABASE_ANON_KEY` — from Supabase project settings

## Supabase schema
Run `schema.sql` in the Supabase SQL editor to create tables.
Tables: `notes`, `tasks`

## Import flow
1. Export from Mac: Notes app → File → Export Notes (zip of HTML files)
2. Export from Mac: Reminders app → File → Export (saves .ics file)
3. Go to Import tab in app, drop both files, click Import Everything
4. Done — Apple Notes and Reminders are retired

## Dev
```
npm install
npm run dev
```

## Deploy
Push to main on GitHub → Vercel auto-deploys.
Add env vars in Vercel dashboard (same names as .env.example).
