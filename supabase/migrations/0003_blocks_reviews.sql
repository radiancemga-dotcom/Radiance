-- ===========================================================================
-- Bloqueios de agenda (admin) e avaliações de reservas
-- ===========================================================================

-- ---- schedule_blocks: datas/períodos indisponibilizados pelo admin ----------
create table if not exists public.schedule_blocks (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  period     reservation_period not null default 'full',
  reason     text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_blocks_date on public.schedule_blocks(date);

alter table public.schedule_blocks enable row level security;

drop policy if exists "blocks_select_all" on public.schedule_blocks;
create policy "blocks_select_all" on public.schedule_blocks for select using (true);
drop policy if exists "blocks_write_admin" on public.schedule_blocks;
create policy "blocks_write_admin" on public.schedule_blocks
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- reviews: avaliação de reservas concluídas ------------------------------
create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  client_name    text not null default '',
  city           text not null default '',
  rating         integer not null check (rating between 1 and 5),
  comment        text not null default '',
  created_at     timestamptz not null default now(),
  unique (reservation_id)
);

alter table public.reviews enable row level security;

-- todos os autenticados podem ler avaliações (média pública / admin)
drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews for select using (true);
-- cliente só avalia a própria reserva concluída
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.reservations r
      where r.id = reservation_id and r.user_id = auth.uid() and r.status = 'completed'
    )
  );

-- notifica o admin quando uma avaliação é criada
create or replace function public.on_review_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, reservation_id)
  values (null, 'review', 'Nova avaliação',
          new.client_name || ' avaliou com ' || new.rating || ' estrela(s).', new.reservation_id);
  return new;
end $$;

drop trigger if exists trg_review_created on public.reviews;
create trigger trg_review_created
  after insert on public.reviews
  for each row execute function public.on_review_created();

-- ---- get_availability: agora une reservas + bloqueios -----------------------
create or replace function public.get_availability()
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
    where r.status <> 'cancelled' and r.date >= current_date - interval '1 day'
    union all
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

grant execute on function public.get_availability() to authenticated, anon;
