# VAYO — Driver Booking Platform

A premium driver-booking platform launching in Mananthavady, Wayanad, Kerala.

## MVP architecture

- **Next.js App Router + TypeScript** — responsive customer, driver and admin experiences
- **Supabase** — database, row-level security and phone OTP authentication
- **Admin-controlled fares** — customers request a quote; only an authorized admin can set/confirm the fare
- **PWA-ready** — accessible on Android, iPhone and desktop browsers

## Project status

This repository is being initialized with the VAYO frontend foundation. Real OTP delivery, Supabase credentials, database migrations, server-side role authorization, driver approval and live booking workflows must be configured before production use.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and anon/publishable key into `.env.local`.
3. Run the SQL migration in `supabase/schema.sql` in the Supabase SQL Editor.
4. Configure Phone OTP and an SMS provider in Supabase Auth.
5. Set up an initial admin role securely through the Supabase dashboard/SQL as described in the setup notes. Never expose a service-role key in browser code.

## Important production checklist

- Enable and test RLS policies for every table.
- Enforce customer, driver and admin permissions on the server/database, not just by hiding UI.
- Verify driver identity, driving licence and eligibility before activation.
- Establish insurance, liability, emergency response and trip-sharing processes.
- Configure SMS delivery, rate limits, abuse protection and consent.
- Add trusted maps/geocoding and payment integrations only after their costs and terms are reviewed.
- Have applicable legal, transport and tax requirements reviewed before launch.

## Initial service area

Mananthavady, Wayanad, Kerala, India.

## Booking types

- One-way
- Hourly
- Full-day

Prices are set and confirmed by an authorized VAYO administrator.
