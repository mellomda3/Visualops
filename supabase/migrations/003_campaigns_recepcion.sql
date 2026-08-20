-- Allow recepción to create/update campaigns (field ops).
drop policy if exists "campaigns write admin" on public.campaigns;

create policy "campaigns write recepcion admin"
  on public.campaigns for all
  to authenticated
  using (public.current_role() in ('recepcion', 'admin'))
  with check (public.current_role() in ('recepcion', 'admin'));
