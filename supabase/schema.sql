-- ===================================================================
-- Yousuf Enterprise — Wholesale Ordering System
-- Phase 1 schema: profiles, categories, products, variants, orders
-- Run this in the Supabase SQL editor on a fresh project.
-- ===================================================================

-- 1. PROFILES ------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  email text,
  address text,
  role text not null default 'customer', -- 'customer' | 'admin'
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CATEGORIES ------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

-- 3. PRODUCTS ------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  product_code text,
  description text,
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  min_wholesale_qty integer not null default 1,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. PRODUCT VARIANTS (e.g. wheel sizes) ----------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,               -- e.g. '2 inch', '3 inch'
  price numeric(12,2),     -- overrides product price if set
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

-- 5. ADDRESSES -------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  address_line text not null,
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. ORDERS ------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_number text unique not null,
  status text not null default 'pending', -- pending|confirmed|processing|shipped|delivered|cancelled
  subtotal numeric(12,2) not null default 0,
  delivery_charge numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  delivery_address text,
  phone text,
  payment_method text,
  created_at timestamptz not null default now()
);

-- 7. ORDER ITEMS -------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  quantity integer not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null
);

-- ===================================================================
-- ROW LEVEL SECURITY
-- ===================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- PROFILES: user sees/edits own row; admin sees all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- CATEGORIES / PRODUCTS / VARIANTS: public read, admin write
create policy "categories_read_all" on public.categories
  for select using (true);
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "products_read_all" on public.products
  for select using (true);
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "variants_read_all" on public.product_variants
  for select using (true);
create policy "variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ADDRESSES: owner only, admin sees all
create policy "addresses_owner" on public.addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- ORDERS: customer sees own orders; admin sees & updates all
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- ORDER ITEMS: visible if you can see the parent order
create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "order_items_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );
