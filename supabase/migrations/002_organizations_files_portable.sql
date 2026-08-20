-- Portable org + file metadata. Safe to run after 001.
-- Avoids vendor lock-in: UUID, timestamptz, text paths (S3-compatible).

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.organizations (name, slug)
select 'Visualops', 'visualops'
where not exists (select 1 from public.organizations);

alter table public.profiles
  add column if not exists organization_id uuid references public.organizations (id);

alter table public.campaigns
  add column if not exists organization_id uuid references public.organizations (id);

update public.profiles p
set organization_id = o.id
from public.organizations o
where p.organization_id is null and o.slug = 'visualops';

update public.campaigns c
set organization_id = o.id
from public.organizations o
where c.organization_id is null and o.slug = 'visualops';

alter table public.files
  add column if not exists mime_type text not null default 'application/octet-stream';

alter table public.files
  add column if not exists size_bytes bigint not null default 0;

alter table public.files
  add column if not exists kind text not null default 'otro';

alter table public.files
  add column if not exists organization_id uuid references public.organizations (id);

comment on column public.files.path is 'Object key in S3-compatible storage. Not a vendor URL.';
comment on column public.files.kind is 'receta | historia | dni | armazon | otro';

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
begin
  select id into org from public.organizations where slug = 'visualops' limit 1;
  insert into public.profiles (id, email, full_name, role, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'recepcion'),
    org
  );
  return new;
end;
$$;

drop policy if exists "files write optico admin" on public.files;
create policy "files write staff"
  on public.files for all
  to authenticated
  using (public.current_role() in ('recepcion', 'graduador', 'optico', 'admin'))
  with check (public.current_role() in ('recepcion', 'graduador', 'optico', 'admin'));

drop policy if exists "archivos authenticated upload" on storage.objects;
create policy "archivos authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'archivos'
    and public.current_role() in ('recepcion', 'graduador', 'optico', 'admin')
  );

alter table public.organizations enable row level security;

drop policy if exists "orgs read authenticated" on public.organizations;
create policy "orgs read authenticated"
  on public.organizations for select
  to authenticated
  using (id = public.current_org_id() or public.current_role() = 'admin');
