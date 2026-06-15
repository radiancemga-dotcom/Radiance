-- ===========================================================================
-- 0006 — Webhook de notificações por e-mail
-- Quando uma linha é inserida em public.notifications, dispara (de forma
-- assíncrona, via pg_net) a Edge Function `send-notification`, que envia o
-- e-mail via Resend. Como o envio é assíncrono (net.http_post), nunca bloqueia
-- nem falha o INSERT da notificação.
-- ===========================================================================

create extension if not exists pg_net;

create or replace function public.notify_send_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := 'https://sxoxnpstmbebpluxtpvp.supabase.co/functions/v1/send-notification',
    body    := jsonb_build_object('record', to_jsonb(NEW)),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  return NEW;
end;
$$;

drop trigger if exists on_notification_created on public.notifications;

create trigger on_notification_created
  after insert on public.notifications
  for each row
  execute function public.notify_send_email();
