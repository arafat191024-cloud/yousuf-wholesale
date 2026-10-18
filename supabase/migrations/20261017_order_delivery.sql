-- Delivery channel + concatenated shipping address for checkout and POS memos.
alter table public.orders add column if not exists shipping_address text;
alter table public.orders add column if not exists delivery_channel text;
alter table public.orders add column if not exists transport_note text;

update public.orders
set shipping_address = coalesce(shipping_address, delivery_address)
where shipping_address is null and delivery_address is not null;
