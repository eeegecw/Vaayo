-- VAYO canonical database schema
-- Initial launch area: Mananthavady, Wayanad, Kerala
-- Booking prices are entered by authorized VAYO admins. Customers never set prices.
--
-- This file is a clean-project bootstrap reference. The connected VAAYO project
-- already has this schema through tracked Supabase migrations; do not re-run
-- migrations on a populated production database without reviewing the diff.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  full_name text,
  role text not null default 'customer'
    check (role in ('customer', 'driver', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  license_number text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  driver_id uuid references public.profiles(id),
  service_type text not null
    check (service_type in ('one_way', 'hourly', 'full_day')),
  pickup text not null,
  destination text,
  scheduled_at timestamptz,
  duration_hours integer,
  status text not null default 'requested'
    check (status in ('requested', 'quoted', 'confirmed', 'declined', 'assigned', 'in_progress', 'completed', 'cancelled')),
  quoted_fare numeric(10,2) check (quoted_fare is null or quoted_fare > 0),
  fare_set_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint bookings_duration_hours_check check (
    (service_type = 'hourly' and duration_hours between 1 and 12)
    or (service_type in ('one_way', 'full_day') and duration_hours is null)
  )
);

create index if not exists bookings_customer_created_idx
  on public.bookings (customer_id, created_at desc);
create index if not exists bookings_driver_status_idx
  on public.bookings (driver_id, status);
create index if not exists bookings_status_created_idx
  on public.bookings (status, created_at);
create index if not exists bookings_fare_set_by_idx
  on public.bookings (fare_set_by);
create index if not exists driver_applications_status_created_idx
  on public.driver_applications (status, created_at);

-- Internal authorization helper. The private schema is not exposed through the Data API.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$function$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Create a profile with a customer role on every new Supabase Auth account.
create or replace function private.handle_new_vayo_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, phone, full_name, role)
  values (
    new.id,
    new.phone,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  )
  on conflict (id) do update set phone = excluded.phone;
  return new;
end;
$function$;
revoke all on function private.handle_new_vayo_user() from public, anon, authenticated;
drop trigger if exists on_vayo_auth_user_created on auth.users;
create trigger on_vayo_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_vayo_user();

alter table public.profiles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()));

drop policy if exists "driver_applications_insert_own_pending" on public.driver_applications;
create policy "driver_applications_insert_own_pending"
  on public.driver_applications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');

drop policy if exists "driver_applications_read_self_or_admin" on public.driver_applications;
create policy "driver_applications_read_self_or_admin"
  on public.driver_applications for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "admins_update_driver_applications" on public.driver_applications;
create policy "admins_update_driver_applications"
  on public.driver_applications for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "bookings_read_customer_driver_or_admin" on public.bookings;
create policy "bookings_read_customer_driver_or_admin"
  on public.bookings for select to authenticated
  using (
    customer_id = (select auth.uid())
    or driver_id = (select auth.uid())
    or (select private.is_admin())
  );

drop policy if exists "customers_insert_own_unpriced_booking" on public.bookings;
create policy "customers_insert_own_unpriced_booking"
  on public.bookings for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'requested'
    and quoted_fare is null
    and fare_set_by is null
    and driver_id is null
  );

drop policy if exists "bookings_update_by_authorized_actor" on public.bookings;
create policy "bookings_update_by_authorized_actor"
  on public.bookings for update to authenticated
  using (
    (select private.is_admin())
    or (
      customer_id = (select auth.uid())
      and status = 'quoted'
      and quoted_fare is not null
    )
    or (
      driver_id = (select auth.uid())
      and status in ('assigned', 'in_progress')
    )
  )
  with check (
    (select private.is_admin())
    or (
      customer_id = (select auth.uid())
      and status in ('confirmed', 'declined')
      and quoted_fare is not null
    )
    or (
      driver_id = (select auth.uid())
      and status in ('in_progress', 'completed')
    )
  );

drop policy if exists "admins_update_profiles" on public.profiles;
create policy "admins_update_profiles"
  on public.profiles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Apply least-privilege SQL grants alongside RLS.
revoke all on public.profiles from anon, authenticated;
revoke all on public.driver_applications from anon, authenticated;
revoke all on public.bookings from anon, authenticated;

grant select, update (role, full_name) on public.profiles to authenticated;
grant select, insert, update (status) on public.driver_applications to authenticated;
grant select, insert, update (status, quoted_fare, fare_set_by, driver_id) on public.bookings to authenticated;

-- Database trigger prevents direct client updates from changing fields or
-- status transitions outside the approved customer/driver workflow.
create or replace function private.guard_booking_update()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  actor_id uuid := (select auth.uid());
begin
  if (select private.is_admin()) then
    return new;
  end if;

  if actor_id is null then
    raise exception 'Sign-in required';
  end if;

  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status') then
    raise exception 'Only booking status may be changed by a customer or driver';
  end if;

  if old.customer_id = actor_id
     and old.status = 'quoted'
     and new.status in ('confirmed', 'declined') then
    return new;
  end if;

  if old.driver_id = actor_id
     and (
       (old.status = 'assigned' and new.status = 'in_progress')
       or (old.status = 'in_progress' and new.status = 'completed')
     ) then
    return new;
  end if;

  raise exception 'Booking status transition not allowed';
end;
$function$;
revoke all on function private.guard_booking_update() from public, anon, authenticated;
drop trigger if exists guard_vayo_booking_update on public.bookings;
create trigger guard_vayo_booking_update
  before update on public.bookings
  for each row execute procedure private.guard_booking_update();

-- Admin-only operations. SECURITY INVOKER makes grants and RLS apply to caller.
create or replace function public.admin_set_booking_quote(p_booking_id uuid, p_amount numeric)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Admin access required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Fare must be greater than zero';
  end if;

  update public.bookings
  set quoted_fare = p_amount, fare_set_by = (select auth.uid()), status = 'quoted'
  where id = p_booking_id and status = 'requested' and quoted_fare is null;

  if not found then
    raise exception 'Booking request not found or already quoted';
  end if;
end;
$function$;

create or replace function public.admin_assign_driver(p_booking_id uuid, p_driver_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Admin access required';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = p_driver_id and p.role = 'driver'
  ) then
    raise exception 'Only an approved VAYO driver can be assigned';
  end if;

  update public.bookings
  set driver_id = p_driver_id, status = 'assigned'
  where id = p_booking_id and status = 'confirmed' and quoted_fare is not null;

  if not found then
    raise exception 'Confirmed booking not found or already assigned';
  end if;
end;
$function$;

create or replace function public.review_driver_application(p_application_id uuid, p_approve boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_user uuid;
  target_name text;
begin
  if (select auth.uid()) is null or not (select private.is_admin()) then
    raise exception 'Admin access required';
  end if;

  select da.user_id, da.full_name into target_user, target_name
  from public.driver_applications da
  where da.id = p_application_id and da.status = 'pending'
  for update;

  if target_user is null then
    raise exception 'Pending driver application not found';
  end if;

  update public.driver_applications
  set status = case when p_approve then 'approved' else 'rejected' end
  where id = p_application_id;

  if p_approve then
    update public.profiles set role = 'driver', full_name = target_name
    where id = target_user;
  end if;
end;
$function$;

create or replace function public.respond_to_booking_quote(p_booking_id uuid, p_accept boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign-in required';
  end if;

  update public.bookings
  set status = case when p_accept then 'confirmed' else 'declined' end
  where id = p_booking_id
    and customer_id = (select auth.uid())
    and status = 'quoted'
    and quoted_fare is not null;

  if not found then
    raise exception 'Booking quote not found or no longer available';
  end if;
end;
$function$;

create or replace function public.driver_update_booking_status(p_booking_id uuid, p_new_status text)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign-in required';
  end if;
  if p_new_status not in ('in_progress', 'completed') then
    raise exception 'Unsupported driver status transition';
  end if;

  update public.bookings set status = p_new_status
  where id = p_booking_id
    and driver_id = (select auth.uid())
    and (
      (status = 'assigned' and p_new_status = 'in_progress')
      or (status = 'in_progress' and p_new_status = 'completed')
    );

  if not found then
    raise exception 'Assigned booking not found or transition not allowed';
  end if;
end;
$function$;

revoke all on function public.admin_set_booking_quote(uuid, numeric) from public, anon;
revoke all on function public.admin_assign_driver(uuid, uuid) from public, anon;
revoke all on function public.review_driver_application(uuid, boolean) from public, anon;
revoke all on function public.respond_to_booking_quote(uuid, boolean) from public, anon;
revoke all on function public.driver_update_booking_status(uuid, text) from public, anon;

grant execute on function public.admin_set_booking_quote(uuid, numeric) to authenticated;
grant execute on function public.admin_assign_driver(uuid, uuid) to authenticated;
grant execute on function public.review_driver_application(uuid, boolean) to authenticated;
grant execute on function public.respond_to_booking_quote(uuid, boolean) to authenticated;
grant execute on function public.driver_update_booking_status(uuid, text) to authenticated;

-- Admin bootstrap: sign in with your own phone first, then run as project owner:
-- update public.profiles set role = 'admin' where phone = '+91YOURMOBILENUMBER';
