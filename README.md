# VAYO — Driver Booking Platform

A premium driver-booking platform launching in **Mananthavady, Wayanad, Kerala**.

**Product promise:** Your car. Your journey. Our driver.

## Technology

- Next.js App Router + TypeScript
- Supabase Phone OTP authentication and PostgreSQL
- Row-level security and protected database functions
- Responsive, installable-web-app foundation for mobile and desktop

## MVP flows

- **Customer:** phone OTP sign-in, one-way/hourly/full-day booking request, booking history, accept or decline an admin fare
- **Driver:** submit a driver application, view assigned bookings, advance assigned trips
- **Admin:** review driver applications, set booking fares, assign approved drivers
- **Pricing:** all fares are set and confirmed by authorized VAYO administrators
- **Hourly bookings:** customers choose 1–12 hours

## Run locally (Windows)

Requirements: Node.js 20.9+ and npm.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Supabase connection

The project’s public client settings are prefilled in `.env.example`. Copy it to `.env.local` as shown above. The publishable key is designed for browser use; it must be paired with the database RLS policies.

- Project URL: https://pbeinsjtgiruivjoufmk.supabase.co
- Project region: ap-northeast-1 (Tokyo)

Never expose a Supabase secret key or service-role key in browser code, a `NEXT_PUBLIC_` variable, or GitHub.

## Enable mobile OTP

In Supabase Dashboard, open **Authentication → Providers → Phone**, enable Phone, then configure an SMS provider (for example Twilio or another supported provider). Phone OTP will not deliver messages until this is configured. Also review Auth rate limits and enable CAPTCHA before public launch.

## Database

The connected Supabase project already has the VAYO database schema and security policies applied.

For a clean project, the canonical bootstrap SQL is in `supabase/schema.sql`. It creates the profiles, driver applications and bookings tables, RLS policies, protected booking RPCs and the hourly-duration constraint.

## Make your first account an admin

1. Enable phone OTP and configure SMS in Supabase.
2. Run the website and sign in with your own phone number once.
3. In Supabase SQL Editor, promote only your own verified account:

```sql
update public.profiles
set role = 'admin'
where phone = '+91YOURMOBILENUMBER';
```

4. Sign out and sign back in, then open the Admin dashboard.

Never allow users to choose their own role. The app does not expose an admin signup option.

## Deployment

Import this GitHub repository into Vercel, add the two public environment variables from `.env.example`, and deploy. Set the Vercel deployment URL as the Supabase Auth Site URL / allowed URL as required by your authentication setup.

## Before public launch

This is an MVP foundation, not a production-ready transport marketplace. Before accepting live customer bookings:

- Test with separate customer, driver and admin accounts.
- Add secure driver document uploads and manual verification.
- Add cancellation, support, emergency escalation and trip-sharing workflows.
- Decide and document insurance, liability, driver eligibility and vehicle-owner consent.
- Configure SMS deliverability, rate limits, CAPTCHA, privacy notices and abuse controls.
- Add driver notifications and operational audit logging.
- Add end-to-end tests and review applicable Kerala/India legal, transport and tax requirements.

## Service area and booking types

- Initial launch: Mananthavady, Wayanad, Kerala, India
- One-way, hourly (1–12 hours), full-day
- Admin sets each booking fare before customer confirmation
