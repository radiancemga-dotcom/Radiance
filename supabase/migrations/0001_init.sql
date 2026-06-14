-- ===========================================================================
-- Radiance Laser — Schema completo (PostgreSQL / Supabase)
-- Tabelas, tipos, índices, triggers, funções, RLS e seeds.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_period as enum ('morning', 'afternoon', 'full');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('pending', 'confirmed', 'in_transit', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type financial_status as enum ('forecast', 'received');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles (1-1 com auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'client',
  full_name   text not null default '',
  cpf         text not null default '',
  crm         text not null default '',
  specialty   text not null default '',
  clinic      text not null default '',
  email       text not null default '',
  phone       text not null default '',
  blocked     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settings (linha única, id = 'settings')
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id                   text primary key default 'settings',
  price_half_period    numeric not null default 2000,
  full_day_discount_pct numeric not null default 10,
  long_distance_km     integer not null default 250,
  mid_distance_km      integer not null default 100,
  morning_start        text not null default '07:00',
  morning_end          text not null default '12:00',
  afternoon_start      text not null default '13:00',
  afternoon_end        text not null default '18:00',
  company_name         text not null default 'Radiance Laser',
  company_phone        text not null default '',
  company_whatsapp     text not null default '',
  company_email        text not null default '',
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- cities
-- ---------------------------------------------------------------------------
create table if not exists public.cities (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  state               text not null,
  lat                 double precision not null default 0,
  lng                 double precision not null default 0,
  distance_km         integer not null default 0,
  force_long_distance boolean,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reservations
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  client_name      text not null default '',
  client_email     text not null default '',
  client_phone     text not null default '',
  date             date not null,
  period           reservation_period not null,
  effective_period reservation_period not null,
  clinic_name      text not null default '',
  address          text not null default '',
  city             text not null default '',
  state            text not null default '',
  cep              text not null default '',
  procedures       text not null default '',
  notes            text not null default '',
  distance_km      integer not null default 0,
  travel_minutes   integer not null default 0,
  is_long_distance boolean not null default false,
  price            numeric not null default 0,
  status           reservation_status not null default 'pending',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_reservations_user on public.reservations(user_id);
create index if not exists idx_reservations_date on public.reservations(date);
create index if not exists idx_reservations_status on public.reservations(status);

-- ---------------------------------------------------------------------------
-- reservation_history
-- ---------------------------------------------------------------------------
create table if not exists public.reservation_history (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  changed_by      uuid,
  changed_by_name text not null default '',
  field           text not null,
  old_value       text not null default '',
  new_value       text not null default '',
  created_at      timestamptz not null default now()
);
create index if not exists idx_history_reservation on public.reservation_history(reservation_id);

-- ---------------------------------------------------------------------------
-- notifications  (user_id NULL = destinada ao admin)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete cascade,
  type           text not null default '',
  title          text not null default '',
  body           text not null default '',
  read           boolean not null default false,
  reservation_id uuid references public.reservations(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id);

-- ---------------------------------------------------------------------------
-- financial_records
-- ---------------------------------------------------------------------------
create table if not exists public.financial_records (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  client_name    text not null default '',
  city           text not null default '',
  amount         numeric not null default 0,
  status         financial_status not null default 'forecast',
  month          text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists idx_financial_month on public.financial_records(month);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid,
  actor_name text not null default '',
  action     text not null default '',
  entity     text not null default '',
  entity_id  text not null default '',
  detail     text not null default '',
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- FUNÇÕES E TRIGGERS
-- ===========================================================================

-- Helper: o usuário atual é admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Cria profile automaticamente ao registrar usuário em auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, cpf, crm, specialty, clinic, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'cpf', ''),
    coalesce(new.raw_user_meta_data->>'crm', ''),
    coalesce(new.raw_user_meta_data->>'specialty', ''),
    coalesce(new.raw_user_meta_data->>'clinic', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;

  -- notifica admin e dá boas-vindas ao cliente
  insert into public.notifications (user_id, type, title, body)
  values (null, 'user_registered', 'Novo cadastro', coalesce(new.raw_user_meta_data->>'full_name','Um cliente') || ' criou uma conta.');
  insert into public.notifications (user_id, type, title, body)
  values (new.id, 'welcome', 'Bem-vindo(a) à Radiance Laser', 'Seu cadastro foi concluído. Já pode realizar sua primeira reserva.');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ao criar reserva: registra financeiro e notificações
create or replace function public.on_reservation_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.financial_records (reservation_id, user_id, client_name, city, amount, status, month)
  values (new.id, new.user_id, new.client_name, new.city, new.price, 'forecast', to_char(new.date, 'YYYY-MM'));

  insert into public.notifications (user_id, type, title, body, reservation_id)
  values (new.user_id, 'reservation_created', 'Reserva criada',
          'Sua reserva para ' || new.city || ' foi registrada (pendente de aprovação).', new.id);
  insert into public.notifications (user_id, type, title, body, reservation_id)
  values (null, 'reservation_created', 'Nova reserva recebida',
          new.client_name || ' solicitou uma reserva em ' || new.city || '.', new.id);

  insert into public.audit_logs (actor_id, actor_name, action, entity, entity_id, detail)
  values (new.user_id, new.client_name, 'create', 'reservation', new.id::text, 'Reserva ' || new.city || ' ' || new.date);
  return new;
end $$;

drop trigger if exists trg_reservation_created on public.reservations;
create trigger trg_reservation_created
  after insert on public.reservations
  for each row execute function public.on_reservation_created();

-- Ao atualizar reserva: histórico campo a campo, sync financeiro, notificações
create or replace function public.on_reservation_updated()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_name text;
begin
  new.updated_at := now();
  select coalesce(full_name, 'Administração') into actor_name from public.profiles where id = auth.uid();

  if new.status is distinct from old.status then
    insert into public.reservation_history (reservation_id, changed_by, changed_by_name, field, old_value, new_value)
    values (new.id, auth.uid(), coalesce(actor_name,'Sistema'), 'status', old.status::text, new.status::text);

    insert into public.notifications (user_id, type, title, body, reservation_id)
    values (new.user_id, 'reservation_' || new.status::text, 'Atualização da reserva',
            case new.status
              when 'confirmed' then 'Sua reserva foi aprovada!'
              when 'in_transit' then 'Seu equipamento está em transporte.'
              when 'completed' then 'Sua reserva foi concluída. Obrigado!'
              when 'cancelled' then 'Sua reserva foi cancelada.'
              else 'Sua reserva foi atualizada.'
            end || ' (' || new.city || ' — ' || new.date || ')', new.id);
  end if;

  if new.date is distinct from old.date then
    insert into public.reservation_history (reservation_id, changed_by, changed_by_name, field, old_value, new_value)
    values (new.id, auth.uid(), coalesce(actor_name,'Sistema'), 'date', old.date::text, new.date::text);
  end if;
  if new.effective_period is distinct from old.effective_period then
    insert into public.reservation_history (reservation_id, changed_by, changed_by_name, field, old_value, new_value)
    values (new.id, auth.uid(), coalesce(actor_name,'Sistema'), 'period', old.effective_period::text, new.effective_period::text);
  end if;
  if new.address is distinct from old.address then
    insert into public.reservation_history (reservation_id, changed_by, changed_by_name, field, old_value, new_value)
    values (new.id, auth.uid(), coalesce(actor_name,'Sistema'), 'address', old.address, new.address);
  end if;

  update public.financial_records
    set amount = new.price,
        city = new.city,
        month = to_char(new.date, 'YYYY-MM'),
        status = case when new.status = 'completed' then 'received'::financial_status else 'forecast'::financial_status end
    where reservation_id = new.id;

  insert into public.audit_logs (actor_id, actor_name, action, entity, entity_id, detail)
  values (auth.uid(), coalesce(actor_name,'Sistema'), 'update', 'reservation', new.id::text,
          case when new.status is distinct from old.status then 'Status -> ' || new.status::text else 'Alteração de reserva' end);
  return new;
end $$;

drop trigger if exists trg_reservation_updated on public.reservations;
create trigger trg_reservation_updated
  before update on public.reservations
  for each row execute function public.on_reservation_updated();

-- Impede conflito de agenda (mesma data / período físico) — exceto canceladas
create or replace function public.prevent_reservation_conflict()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  conflict_count integer;
  new_slots text[];
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  if new.is_long_distance or new.effective_period = 'full' then
    new_slots := array['morning','afternoon'];
  else
    new_slots := array[new.effective_period::text];
  end if;

  select count(*) into conflict_count
  from public.reservations r
  where r.date = new.date
    and r.id <> new.id
    and r.status <> 'cancelled'
    and (
      (r.is_long_distance or r.effective_period = 'full')
      or r.effective_period::text = any(new_slots)
    )
    and (
      new.is_long_distance or new.effective_period = 'full'
      or r.effective_period::text = any(new_slots)
      or r.is_long_distance or r.effective_period = 'full'
    );

  if conflict_count > 0 then
    raise exception 'Conflito de agenda: já existe reserva nessa data e período.';
  end if;
  return new;
end $$;

drop trigger if exists trg_reservation_conflict on public.reservations;
create trigger trg_reservation_conflict
  before insert or update on public.reservations
  for each row execute function public.prevent_reservation_conflict();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================
alter table public.profiles            enable row level security;
alter table public.settings            enable row level security;
alter table public.cities              enable row level security;
alter table public.reservations        enable row level security;
alter table public.reservation_history enable row level security;
alter table public.notifications       enable row level security;
alter table public.financial_records   enable row level security;
alter table public.audit_logs          enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- settings (todos leem, só admin altera)
drop policy if exists "settings_select_all" on public.settings;
create policy "settings_select_all" on public.settings for select using (true);
drop policy if exists "settings_update_admin" on public.settings;
create policy "settings_update_admin" on public.settings for update using (public.is_admin());

-- cities (todos leem, só admin escreve)
drop policy if exists "cities_select_all" on public.cities;
create policy "cities_select_all" on public.cities for select using (true);
drop policy if exists "cities_write_admin" on public.cities;
create policy "cities_write_admin" on public.cities for all using (public.is_admin()) with check (public.is_admin());

-- reservations
drop policy if exists "reservations_select_own_or_admin" on public.reservations;
create policy "reservations_select_own_or_admin" on public.reservations
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reservations_insert_own" on public.reservations;
create policy "reservations_insert_own" on public.reservations
  for insert with check (user_id = auth.uid());
drop policy if exists "reservations_update_own_or_admin" on public.reservations;
create policy "reservations_update_own_or_admin" on public.reservations
  for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reservations_delete_admin" on public.reservations;
create policy "reservations_delete_admin" on public.reservations
  for delete using (public.is_admin());

-- reservation_history
drop policy if exists "history_select_related" on public.reservation_history;
create policy "history_select_related" on public.reservation_history
  for select using (
    public.is_admin() or exists (
      select 1 from public.reservations r where r.id = reservation_id and r.user_id = auth.uid()
    )
  );

-- notifications
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using ((user_id is null and public.is_admin()) or user_id = auth.uid());
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using ((user_id is null and public.is_admin()) or user_id = auth.uid());

-- financial_records (somente admin)
drop policy if exists "financial_admin" on public.financial_records;
create policy "financial_admin" on public.financial_records
  for select using (public.is_admin());

-- audit_logs (somente admin)
drop policy if exists "audit_admin" on public.audit_logs;
create policy "audit_admin" on public.audit_logs
  for select using (public.is_admin());

-- ===========================================================================
-- SEEDS
-- ===========================================================================
insert into public.settings (id) values ('settings') on conflict (id) do nothing;

insert into public.cities (name, state, lat, lng, distance_km) values
  ('Maringá', 'PR', -23.4253, -51.9386, 0),
  ('Sarandi', 'PR', -23.4435, -51.8762, 12),
  ('Londrina', 'PR', -23.3045, -51.1696, 100),
  ('Cascavel', 'PR', -24.9555, -53.4552, 290),
  ('Curitiba', 'PR', -25.4284, -49.2733, 430)
on conflict do nothing;

-- ===========================================================================
-- COMO TORNAR UM USUÁRIO ADMIN
-- Após o usuário se cadastrar pela aplicação, rode (substituindo o e-mail):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@radiancelaser.com.br');
-- ===========================================================================
