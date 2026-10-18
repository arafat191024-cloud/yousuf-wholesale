-- Optional columns for the product editor.
-- The storefront already reads products.series and products.size when they exist.
alter table public.products add column if not exists series text;
alter table public.products add column if not exists size text;
