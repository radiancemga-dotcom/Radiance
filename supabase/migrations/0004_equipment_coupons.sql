-- ===========================================================================
-- Múltiplos equipamentos, cupons de desconto e campos de pagamento
-- ===========================================================================

do $$ begin
  create type payment_status as enum ('none', 'pending', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type coupon_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;

-- ---- equipment --------------------------------------------------------------
create table if not exists public.equipment (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.equipment enable row level security;
drop policy if exists "equipment_select_all" on public.equipment;
create policy "equipment_select_all" on public.equipment for select using (true);
drop policy if exists "equipment_write_admin" on public.equipment;
create policy "equipment_write_admin" on public.equipment
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- coupons ----------------------------------------------------------------
create table if not exists public.coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  discount_type coupon_type not null default 'percent',
  value         numeric not null default 0,
  active        boolean not null default true,
  expires_at    date,
  created_at    timestamptz not null default now()
);

alter table public.coupons enable row level security;
-- clientes podem validar cupons ativos (select); admin gerencia tudo
drop policy if exists "coupons_select_active_or_admin" on public.coupons;
create policy "coupons_select_active_or_admin" on public.coupons
  for select using (active or public.is_admin());
drop policy if exists "coupons_write_admin" on public.coupons;
create policy "coupons_write_admin" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- novas colunas em reservations -----------------------------------------
alter table public.reservations
  add column if not exists equipment_id    uuid references public.equipment(id),
  add column if not exists equipment_name  text not null default '',
  add column if not exists coupon_code     text not null default '',
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists payment_status  payment_status not null default 'none',
  add column if not exists payment_link    text not null default '';

create index if not exists idx_reservations_equipment on public.reservations(equipment_id);

-- ---- get_availability agora aceita filtro por equipamento ------------------
drop function if exists public.get_availability();
drop function if exists public.get_availability(uuid);

create or replace function public.get_availability(p_equipment uuid default null)
returns table (date date, morning boolean, afternoon boolean)
language sql
stable
security definer
set search_path = public
as $$
  with occ as (
    select r.date,
           (r.is_long_distance or r.effective_period in ('full','morning'))   as morning,
           (r.is_long_distance or r.effective_period in ('full','afternoon')) as afternoon
    from public.reservations r
    where r.status <> 'cancelled'
      and r.date >= current_date - interval '1 day'
      and (p_equipment is null or r.equipment_id = p_equipment)
    union all
    -- bloqueios do admin valem para todos os equipamentos
    select b.date,
           (b.period in ('full','morning'))   as morning,
           (b.period in ('full','afternoon')) as afternoon
    from public.schedule_blocks b
    where b.date >= current_date - interval '1 day'
  )
  select occ.date, bool_or(occ.morning) as morning, bool_or(occ.afternoon) as afternoon
  from occ
  group by occ.date;
$$;

grant execute on function public.get_availability(uuid) to authenticated, anon;

-- ---- seeds ------------------------------------------------------------------
insert into public.equipment (name, description) values
  ('DEKA DUOGlide', 'CO₂ fracionado híbrido (10600 nm + 1540 nm) — rejuvenescimento, cicatrizes e ginecologia.')
on conflict do nothing;

insert into public.coupons (code, discount_type, value) values
  ('BEMVINDO10', 'percent', 10),
  ('PARCEIRO200', 'fixed', 200)
on conflict (code) do nothing;
