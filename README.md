# VAYO — Driver Booking Platform

A premium driver-booking platform launching in **Mananthavady, Wayanad, Kerala**.

**Product promise:** Your car. Your journey. Our driver.

## Technology

- Next.js App Router + TypeScript
- Supabase email/password authentication and PostgreSQL
- Row-level security and protected database functions
- Responsive, installable-web-app foundation for mobile and desktop

## MVP flows

- **Customer:** email/password account, one-way/hourly/full-day booking request, booking history, accept or decline an admin fare
- **Driver:** submit a driver application, view assigned bookings, advance assigned trips
- **Admin:** review driver applications, set booking fares, assign approved drivers
- **Pricing:** all fares are set and confirmed by authorized VAYO administrators
- **Hourly bookings:** customers choose 1–12 hours

## Run locally (Windows)

Requirements: Node.js 20.9+ and npm.

```powershell
Copy-Item .env.example .env.local
npm install --no-audit --no-fund
npm run dev
```

Open http://localhost:3000.

## Supabase connection

The project’s public client settings are prefilled in `.env.example`. Copy it to `.env.local` as shown above. The publishable key is designed for browser use; it must be paired with the database RLS policies.

- Project URL: https://pbeinsjtgiruivjoufmk.supabase.co
- Project region: ap-northeast-1 (Tokyo)

Never expose a Supabase secret key or service-role key in browser code, a `NEXT_PUBLIC_` variable, or GitHub.

## Enable email/password sign-in

Email/password authentication is enabled by default in Supabase. To allow accounts to sign in immediately without an email confirmation link, open **Authentication → Providers → Email** in the Supabase Dashboard and turn off **Confirm email**. With confirmation disabled, Supabase returns a session as soon as an account is created. Keep a strong password policy and review Auth rate limits before public launch. This app uses the email address as the sign-in ID; the username/display name is collected separately.


## Database

The connected Supabase project already has the VAYO database schema and security policies applied.

For a clean project, the canonical bootstrap SQL is in `supabase/schema.sql`. It creates the profiles, driver applications and bookings tables, RLS policies, protected booking RPCs and the hourly-duration constraint.

## Make your first account an admin

1. Create your account in the website using your email address and password.
2. In Supabase SQL Editor, promote only your own account by its email address:

```sql
update public.profiles p
set role = 'admin'
where p.id = (
  select u.id from auth.users u
  where u.email = 'you@example.com'
);
```
3. Sign out and sign back in, then open the Admin dashboard.


Never allow users to choose their own role. The app does not expose an admin signup option.

## Deployment

Import this GitHub repository into Vercel, add the two public environment variables from `.env.example`, and deploy. Set the Vercel deployment URL as the Supabase Auth Site URL / allowed URL as required by your authentication setup.

## Before public launch

This is an MVP foundation, not a production-ready transport marketplace. Before accepting live customer bookings:

- Test with separate customer, driver and admin accounts.
- Add secure driver document uploads and manual verification.
- Add cancellation, support, emergency escalation and trip-sharing workflows.
- Decide and document insurance, liability, driver eligibility and vehicle-owner consent.
- Configure email deliverability if confirmations or password recovery are enabled, rate limits, CAPTCHA, privacy notices and abuse controls.
- Add driver notifications and operational audit logging.
- Add end-to-end tests and review applicable Kerala/India legal, transport and tax requirements.

## Service area and booking types

- Initial launch: Mananthavady, Wayanad, Kerala, India
- One-way, hourly (1–12 hours), full-day
- Admin sets each booking fare before customer confirmation

## Repository checks

Run the same checks used by continuous integration before proposing a change:

    npm install --no-audit --no-fund
    npm audit
    npm run lint
    npm run typecheck
    npm run build

The repository tracks a canonical bootstrap schema in supabase/schema.sql.
The connected Supabase project also has applied migration history; keep future
database changes in version-controlled migration files and review them before
applying them to a populated project.
