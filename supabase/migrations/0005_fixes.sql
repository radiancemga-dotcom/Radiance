-- ===========================================================================
-- Correções (varredura de qualidade)
--  1) Conflito de agenda agora é por EQUIPAMENTO (multi-equipamento).
--  2) Reserva cancelada deixa de contar na receita prevista (remove o
--     registro financeiro correspondente).
-- ===========================================================================

-- 1) Conflito de agenda escopado por equipamento -----------------------------
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
    and r.equipment_id is not distinct from new.equipment_id   -- mesmo equipamento
    and (
      r.is_long_distance
      or r.effective_period = 'full'
      or r.effective_period::text = any(new_slots)
    );

  if conflict_count > 0 then
    raise exception 'Conflito de agenda: já existe reserva nessa data e período para este equipamento.';
  end if;
  return new;
end $$;

-- 2) Sincronização financeira: cancelada remove a previsão de receita --------
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

  if new.status = 'cancelled' then
    delete from public.financial_records where reservation_id = new.id;
  else
    update public.financial_records
      set amount = new.price,
          city = new.city,
          month = to_char(new.date, 'YYYY-MM'),
          status = case when new.status = 'completed' then 'received'::financial_status else 'forecast'::financial_status end
      where reservation_id = new.id;
  end if;

  insert into public.audit_logs (actor_id, actor_name, action, entity, entity_id, detail)
  values (auth.uid(), coalesce(actor_name,'Sistema'), 'update', 'reservation', new.id::text,
          case when new.status is distinct from old.status then 'Status -> ' || new.status::text else 'Alteração de reserva' end);
  return new;
end $$;
