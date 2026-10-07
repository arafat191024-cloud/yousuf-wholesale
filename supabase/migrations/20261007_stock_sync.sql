-- Bi-directional stock sync for website orders and offline memos.
-- Run this once in the Supabase SQL editor.
-- Safe to re-run: holds are inserted only when missing, so stock is not deducted twice.

create table if not exists public.order_stock_holds (
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity >= 0),
  primary key (order_id, product_id)
);

alter table public.order_stock_holds enable row level security;

-- Releases held pieces before the order row disappears.
create or replace function public.release_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select h.product_id, h.quantity
    from public.order_stock_holds h
    where h.order_id = old.id
    order by h.product_id
  loop
    update public.products
    set stock = stock + rec.quantity
    where id = rec.product_id;
  end loop;

  delete from public.order_stock_holds where order_id = old.id;
  return old;
end;
$$;

-- Idempotent: desired hold minus recorded hold is the only stock change.
drop function if exists public.sync_order_stock(uuid, text, jsonb);

create or replace function public.sync_order_stock(
  p_order_id uuid,
  p_status text default null,
  p_items jsonb default null,
  p_payment_status text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_items jsonb;
  v_payment text;
  v_managed boolean;
  v_changes jsonb := '[]'::jsonb;
  rec record;
begin
  if p_status is null and p_items is null then
    select o.status, o.items, o.payment_status
      into v_status, v_items, v_payment
    from public.orders o
    where o.id = p_order_id;

    if not found then
      for rec in
        select h.product_id, h.quantity
        from public.order_stock_holds h
        where h.order_id = p_order_id
        order by h.product_id
      loop
        update public.products
        set stock = stock + rec.quantity
        where id = rec.product_id;
      end loop;
      delete from public.order_stock_holds where order_id = p_order_id;
      return;
    end if;
  else
    v_status := coalesce(p_status, '');
    v_items := coalesce(p_items, '[]'::jsonb);
    v_payment := coalesce(p_payment_status, '');
  end if;

  select exists (
    select 1 from public.order_stock_holds h where h.order_id = p_order_id
  ) or exists (
    select 1
    from jsonb_array_elements(coalesce(v_items, '[]'::jsonb)) elem
    where lower(coalesce(elem->>'stockTracked', '')) in ('true', 't', '1')
  )
  into v_managed;

  if not v_managed then
    return;
  end if;

  perform 1
  from public.products p
  where p.id in (
    select (elem->>'productId')::uuid
    from jsonb_array_elements(coalesce(v_items, '[]'::jsonb)) elem
    where (elem->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    union
    select h.product_id
    from public.order_stock_holds h
    where h.order_id = p_order_id
  )
  order by p.id
  for update;

  for rec in
    with desired as (
      select (elem->>'productId')::uuid as product_id,
             sum(greatest(coalesce((elem->>'quantity')::numeric, 0), 0))::integer as quantity
      from jsonb_array_elements(coalesce(v_items, '[]'::jsonb)) elem
      where lower(coalesce(v_status, '')) not in ('cancelled', 'failed')
        and lower(coalesce(v_payment, '')) <> 'failed'
        and (elem->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      group by 1
    ),
    combined as (
      select coalesce(d.product_id, h.product_id) as product_id,
             coalesce(d.quantity, 0) as desired,
             coalesce(h.quantity, 0) as held
      from desired d
      full join public.order_stock_holds h
        on h.product_id = d.product_id
       and h.order_id = p_order_id
      where d.product_id is not null or h.order_id = p_order_id
    )
    select c.product_id, c.desired, c.held, p.stock
    from combined c
    join public.products p on p.id = c.product_id
    order by c.product_id
  loop
    if rec.desired > rec.held and rec.stock < (rec.desired - rec.held) then
      raise exception 'INSUFFICIENT_STOCK:%', rec.product_id using errcode = 'P0001';
    end if;
    v_changes := v_changes || jsonb_build_array(
      jsonb_build_object(
        'product_id', rec.product_id,
        'desired', rec.desired,
        'held', rec.held
      )
    );
  end loop;

  for rec in
    select *
    from jsonb_to_recordset(v_changes) as x(product_id uuid, desired integer, held integer)
  loop
    if rec.desired <> rec.held then
      update public.products
      set stock = stock - (rec.desired - rec.held)
      where id = rec.product_id;
    end if;

    if rec.desired = 0 then
      delete from public.order_stock_holds
      where order_id = p_order_id and product_id = rec.product_id;
    else
      insert into public.order_stock_holds (order_id, product_id, quantity)
      values (p_order_id, rec.product_id, rec.desired)
      on conflict (order_id, product_id)
      do update set quantity = excluded.quantity;
    end if;
  end loop;
end;
$$;

create or replace function public.orders_stock_after_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_order_stock(
    new.id,
    coalesce(new.status, ''),
    coalesce(new.items, '[]'::jsonb),
    coalesce(new.payment_status, '')
  );
  return new;
end;
$$;

drop trigger if exists orders_stock_after_write on public.orders;
create trigger orders_stock_after_write
after insert or update on public.orders
for each row
execute function public.orders_stock_after_write();

drop trigger if exists orders_stock_before_delete on public.orders;
create trigger orders_stock_before_delete
before delete on public.orders
for each row
execute function public.release_order_stock();

revoke all on function public.sync_order_stock(uuid, text, jsonb, text) from public;
grant execute on function public.sync_order_stock(uuid, text, jsonb, text) to anon, authenticated, service_role;

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

-- One-time alignment.
-- Website orders have never reduced products.stock, so those quantities are deducted now.
-- Offline memos already reduced stock (stockApplied), so they only get a hold record.
do $$
declare
  rec record;
begin
  insert into public.order_stock_holds (order_id, product_id, quantity)
  select o.id,
         (elem->>'productId')::uuid,
         sum(greatest(coalesce((elem->>'quantity')::numeric, 0), 0))::integer
  from public.orders o
  cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) elem
  where lower(coalesce(o.status, '')) not in ('cancelled', 'failed')
    and lower(coalesce(elem->>'stockApplied', '')) in ('true', 't', '1')
    and (elem->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  group by o.id, (elem->>'productId')::uuid
  on conflict (order_id, product_id) do nothing;

  for rec in
    select o.id as order_id,
           (elem->>'productId')::uuid as product_id,
           sum(greatest(coalesce((elem->>'quantity')::numeric, 0), 0))::integer as quantity
    from public.orders o
    cross join lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) elem
    where lower(coalesce(o.status, '')) not in ('cancelled', 'failed')
      and lower(coalesce(o.payment_status, '')) <> 'failed'
      and lower(coalesce(elem->>'stockApplied', '')) not in ('true', 't', '1')
      and (elem->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    group by o.id, (elem->>'productId')::uuid
    order by 2, 1
  loop
    if exists (
      select 1
      from public.order_stock_holds h
      where h.order_id = rec.order_id and h.product_id = rec.product_id
    ) then
      continue;
    end if;

    update public.products
    set stock = stock - rec.quantity
    where id = rec.product_id;

    if found then
      insert into public.order_stock_holds (order_id, product_id, quantity)
      values (rec.order_id, rec.product_id, rec.quantity)
      on conflict (order_id, product_id) do nothing;
    end if;
  end loop;

  update public.orders o
  set items = (
    select coalesce(jsonb_agg(
      case
        when lower(coalesce(elem->>'stockApplied', '')) in ('true', 't', '1')
          then elem || jsonb_build_object('stockTracked', true)
        else elem || jsonb_build_object('stockApplied', true, 'stockTracked', true)
      end
    ), '[]'::jsonb)
    from jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) elem
  )
  where lower(coalesce(o.status, '')) not in ('cancelled', 'failed')
    and o.items is not null
    and exists (
      select 1 from public.order_stock_holds h where h.order_id = o.id
    );
end $$;
