-- Storefront hero banners. Public reads active rows; admins manage every row.
create table if not exists public.promotional_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  target_link text default '/',
  is_active boolean default true,
  priority int default 0,
  created_at timestamptz default now()
);

create index if not exists promotional_banners_live_idx
  on public.promotional_banners (priority asc, created_at desc);

alter table public.promotional_banners enable row level security;

drop policy if exists "banners_read_active_or_admin" on public.promotional_banners;
create policy "banners_read_active_or_admin" on public.promotional_banners
  for select using (is_active = true or public.is_admin());

drop policy if exists "banners_admin_write" on public.promotional_banners;
create policy "banners_admin_write" on public.promotional_banners
  for all using (public.is_admin()) with check (public.is_admin());
