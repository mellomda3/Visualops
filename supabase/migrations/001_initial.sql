-- Visualops initial schema
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create type public.user_role as enum ('recepcion', 'graduador', 'optico', 'admin');

create type public.record_status as enum (
  'precargada',
  'graduada',
  'pendiente',
  'confirmada',
  'entregada',
  'cancelada'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.user_role not null default 'recepcion',
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.campaign_counters (
  campaign_id uuid primary key references public.campaigns (id) on delete cascade,
  last_number integer not null default 0
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete restrict,
  ficha_nro text not null,
  status public.record_status not null default 'precargada',
  full_name text not null,
  phone text not null default '',
  age integer,
  street text not null default '',
  city text not null default '',
  insurance text not null default '',
  recipe_nro text not null default '',
  appointment_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, ficha_nro)
);

create table public.refractions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null unique references public.records (id) on delete cascade,
  od_sph numeric(6,2),
  od_cyl numeric(6,2),
  od_axis numeric(6,2),
  os_sph numeric(6,2),
  os_cyl numeric(6,2),
  os_axis numeric(6,2),
  add_power numeric(6,2),
  dnp numeric(6,2),
  notes text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null unique references public.records (id) on delete cascade,
  lens text,
  frame text,
  treatment text,
  color text,
  shape text,
  distance text,
  total numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  balance numeric(12,2) generated always as (total - deposit) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  path text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'recepcion')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.next_ficha_nro(p_campaign_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into public.campaign_counters (campaign_id, last_number)
  values (p_campaign_id, 1)
  on conflict (campaign_id)
  do update set last_number = public.campaign_counters.last_number + 1
  returning last_number into n;

  return lpad(n::text, 4, '0');
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger records_updated_at
  before update on public.records
  for each row execute function public.set_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.records enable row level security;
alter table public.refractions enable row level security;
alter table public.orders enable row level security;
alter table public.files enable row level security;
alter table public.campaign_counters enable row level security;

create policy "profiles read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles admin update"
  on public.profiles for update
  using (public.current_role() = 'admin');

create policy "campaigns read authenticated"
  on public.campaigns for select
  to authenticated
  using (true);

create policy "campaigns write admin"
  on public.campaigns for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

create policy "records read authenticated"
  on public.records for select
  to authenticated
  using (true);

create policy "records insert reception admin"
  on public.records for insert
  to authenticated
  with check (public.current_role() in ('recepcion', 'admin'));

create policy "records update staff"
  on public.records for update
  to authenticated
  using (public.current_role() in ('recepcion', 'graduador', 'optico', 'admin'));

create policy "records delete admin"
  on public.records for delete
  to authenticated
  using (public.current_role() = 'admin');

create policy "refractions read authenticated"
  on public.refractions for select
  to authenticated
  using (true);

create policy "refractions write graduador admin"
  on public.refractions for all
  to authenticated
  using (public.current_role() in ('graduador', 'admin'))
  with check (public.current_role() in ('graduador', 'admin'));

create policy "orders read authenticated"
  on public.orders for select
  to authenticated
  using (true);

create policy "orders write optico admin"
  on public.orders for all
  to authenticated
  using (public.current_role() in ('optico', 'admin'))
  with check (public.current_role() in ('optico', 'admin'));

create policy "files read authenticated"
  on public.files for select
  to authenticated
  using (true);

create policy "files write optico admin"
  on public.files for all
  to authenticated
  using (public.current_role() in ('optico', 'admin'))
  with check (public.current_role() in ('optico', 'admin'));

create policy "counters read authenticated"
  on public.campaign_counters for select
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('archivos', 'archivos', true)
on conflict (id) do nothing;

create policy "archivos public read"
  on storage.objects for select
  using (bucket_id = 'archivos');

create policy "archivos authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'archivos' and public.current_role() in ('optico', 'admin'));
