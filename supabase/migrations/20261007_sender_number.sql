-- ===================================================================
-- Yousuf Enterprise — sender number on prepaid orders
-- Run once in the Supabase SQL editor on the LIVE project.
-- Safe to re-run.
-- ===================================================================

alter table public.orders add column if not exists sender_number text;

comment on column public.orders.sender_number is 'Mobile number that sent the bKash or bank transfer';
