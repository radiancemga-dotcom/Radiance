// ===========================================================================
// Edge Function: asaas-webhook
// Recebe webhooks do Asaas e atualiza o status de pagamento da reserva e o
// registro financeiro correspondente.
//
// Configure em Asaas > Integrações > Webhooks apontando para a URL desta função.
// Opcional: defina ASAAS_WEBHOOK_TOKEN e configure o mesmo token no Asaas
// (header "asaas-access-token") para validar a origem.
// ===========================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";

const PAID_EVENTS = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
const REFUND_EVENTS = ["PAYMENT_REFUNDED", "PAYMENT_REVERSED"];

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  if (WEBHOOK_TOKEN) {
    const token = req.headers.get("asaas-access-token");
    if (token !== WEBHOOK_TOKEN) return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();
    const event: string = payload.event;
    const reservationId: string | undefined = payload.payment?.externalReference;
    if (!reservationId) return new Response(JSON.stringify({ skipped: true }), { status: 200 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (PAID_EVENTS.includes(event)) {
      await supabase.from("reservations").update({ payment_status: "paid" }).eq("id", reservationId);
      await supabase.from("financial_records").update({ status: "received" }).eq("reservation_id", reservationId);
      await supabase.from("notifications").insert({
        user_id: null,
        type: "payment_received",
        title: "Pagamento recebido",
        body: `Pagamento confirmado para a reserva ${reservationId}.`,
        reservation_id: reservationId,
      });
    } else if (REFUND_EVENTS.includes(event)) {
      await supabase.from("reservations").update({ payment_status: "refunded" }).eq("id", reservationId);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 });
  }
});
