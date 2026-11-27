-- VAYO MVP schema
-- Run this file in Supabase SQL Editor after creating your project.
-- This is a starter schema; test policies with separate customer, driver and admin accounts before launch.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text,
  role text not null default 'customer' check (role in ('customer','driver','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  license_number text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  driver_id uuid references public.profiles(id),
  service_type text not null check (service_type in ('one_way','hourly','full_day')),
  pickup text not null,
  destination text,
  scheduled_at timestamptz,
  status text not null default 'requested'
    check (status in ('requested','quoted','confirmed','declined','assigned','in_progress','completed','cancelled')),
  quoted_fare numeric(10,2) check (quoted_fare is null or quoted_fare > 0),
  fare_set_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Admin-maintained service settings. The customer UI does not calculate or invent a fare.
create table if not exists public.service_prices (
  id uuid primary key default gen_random_uuid(),
  service_type text not null unique check (service_type in ('one_way','hourly','full_day')),
  label text not null,
  active boolean not null default true,
  admin_notes text,
  updated_at timestamptz not null default now()
);

insert into public.service_prices (service_type, label)
values ('one_way','One-way'), ('hourly','Hourly'), ('full_day','Full-day')
on conflict (service_type) do nothing;

-- Create a customer profile automatically when Supabase Phone Auth creates an auth user.
create or replace function public.handle_new_vayo_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone, full_name, role)
  values (new.id, new.phone, nullif(new.raw_user_meta_data->>'full_name',''), 'customer')
  on conflict (id) do update set phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_vayo_auth_user_created on auth.users;
create trigger on_vayo_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_vayo_user();

-- Security-definer helper avoids recursive RLS checks against profiles.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.bookings enable row level security;
alter table public.service_prices enable row level security;

drop policy if exists "profile self or admin read" on public.profiles;
create policy "profile self or admin read" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Limit profile updates to the display name; users cannot promote themselves.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists "driver application self insert" on public.driver_applications;
create policy "driver application self insert" on public.driver_applications
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "driver application self or admin read" on public.driver_applications;
create policy "driver application self or admin read" on public.driver_applications
  for select to authenticated
  using (user_id = auth.uid() or public.current_user_is_admin());

grant select, insert on public.driver_applications to authenticated;

drop policy if exists "booking customer driver admin read" on public.bookings;
create policy "booking customer driver admin read" on public.bookings
  for select to authenticated
  using (
    customer_id = auth.uid()
    or driver_id = auth.uid()
    or public.current_user_is_admin()
  );

drop policy if exists "customer creates own unpriced request" on public.bookings;
create policy "customer creates own unpriced request" on public.bookings
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and status = 'requested'
    and quoted_fare is null
    and fare_set_by is null
    and driver_id is null
  );

drop policy if exists "admin manages bookings" on public.bookings;
create policy "admin manages bookings" on public.bookings
  for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

grant select, insert, update on public.bookings to authenticated;

drop policy if exists "authenticated reads service types" on public.service_prices;
create policy "authenticated reads service types" on public.service_prices
  for select to authenticated using (true);

drop policy if exists "admin manages service prices" on public.service_prices;
create policy "admin manages service prices" on public.service_prices
  for all to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

grant select, insert, update, delete on public.service_prices to authenticated;

-- Customer accepts or declines an admin-issued fare. Customers cannot edit the price.
create or replace function public.respond_to_booking_quote(p_booking_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings
  set status = case when p_accept then 'confirmed' else 'declined' end
  where id = p_booking_id
    and customer_id = auth.uid()
    and status = 'quoted'
    and quoted_fare is not null;
  if not found then
    raise exception 'Booking quote not found or no longer available';
  end if;
end;
$$;

-- Only an admin can approve a driver. Approval changes the protected profile role.
create or replace function public.review_driver_application(p_application_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'Admin access required';
  end if;

  select user_id into target_user
  from public.driver_applications
  where id = p_application_id and status = 'pending'
  for update;

  if target_user is null then
    raise exception 'Pending driver application not found';
  end if;

  update public.driver_applications
  set status = case when p_approve then 'approved' else 'rejected' end
  where id = p_application_id;

  if p_approve then
    update public.profiles p
    set role = 'driver',
        full_name = coalesce((select a.full_name from public.driver_applications a where a.id = p_application_id), p.full_name)
    where p.id = target_user;
  end if;
end;
$$;

-- A driver can only advance a trip already assigned to that driver.
create or replace function public.driver_update_booking_status(p_booking_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_new_status not in ('in_progress','completed') then
    raise exception 'Unsupported driver status transition';
  end if;

  update public.bookings
  set status = p_new_status
  where id = p_booking_id
    and driver_id = auth.uid()
    and (
      (status = 'assigned' and p_new_status = 'in_progress')
      or (status = 'in_progress' and p_new_status = 'completed')
    );

  if not found then
    raise exception 'Assigned booking not found or transition not allowed';
  end if;
end;
$$;

revoke all on function public.respond_to_booking_quote(uuid, boolean) from public;
revoke all on function public.review_driver_application(uuid, boolean) from public;
revoke all on function public.driver_update_booking_status(uuid, text) from public;
grant execute on function public.respond_to_booking_quote(uuid, boolean) to authenticated;
grant execute on function public.review_driver_application(uuid, boolean) to authenticated;
grant execute on function public.driver_update_booking_status(uuid, text) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;

-- After your own phone number has signed in once, promote that account to admin
-- by running this manually in the Supabase SQL Editor as the project owner:
-- update public.profiles set role = 'admin' where phone = '+91YOURMOBILENUMBER';
