-- ===================================================================
-- Yousuf Enterprise — order payment tracking
-- Run once in the Supabase SQL editor on the LIVE project.
-- Safe to re-run: every statement is idempotent.
-- Does not change product stock columns or the admin stock math,
-- which still reads the JSON cart snapshot in orders.items.
-- ===================================================================

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists shop_name text;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_status text;
alter table public.orders add column if not exists transaction_id text;
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists items jsonb;

-- Guest checkout omits user_id. Logged-in checkout still sends auth.uid().
alter table public.orders alter column user_id drop not null;

alter table public.orders alter column payment_status set default 'pending';
alter table public.orders alter column items set default '[]'::jsonb;

update public.orders set payment_status = 'pending' where payment_status is null;
update public.orders set items = '[]'::jsonb where items is null;

-- pending = unpaid, verified = paid / verified, failed = rejected transfer.
comment on column public.orders.payment_method is 'cod | bkash | bank';
comment on column public.orders.payment_status is 'pending | verified | failed';
comment on column public.orders.transaction_id is 'bKash or bank TrxID entered at checkout';
comment on column public.orders.items is 'Cart snapshot used by admin live-stock calculation';

create index if not exists orders_transaction_id_idx on public.orders (transaction_id);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_phone_idx on public.orders (phone);

-- Extra insert path for shoppers who are not signed in.
-- Existing "orders_insert_own" policy is left in place for logged-in customers.
drop policy if exists "orders_insert_guest" on public.orders;
create policy "orders_insert_guest" on public.orders
  for insert
  with check (auth.uid() is null and user_id is null);
