-- ===========================================================================
-- Função de disponibilidade agregada
-- Retorna, por data, se a manhã e a tarde estão ocupadas — SEM expor dados
-- pessoais. Roda como security definer para que clientes vejam a ocupação
-- geral (necessário para o calendário de disponibilidade na Nova Reserva)
-- sem violar as políticas RLS que restringem a leitura de reservas alheias.
-- ===========================================================================
create or replace function public.get_availability()
returns table (date date, morning boolean, afternoon boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.date,
    bool_or(r.is_long_distance or r.effective_period = 'full' or r.effective_period = 'morning')   as morning,
    bool_or(r.is_long_distance or r.effective_period = 'full' or r.effective_period = 'afternoon')  as afternoon
  from public.reservations r
  where r.status <> 'cancelled'
    and r.date >= current_date - interval '1 day'
  group by r.date;
$$;

-- Permite que usuários autenticados (e anônimos, se desejar exibir na landing)
-- executem a função.
grant execute on function public.get_availability() to authenticated, anon;
