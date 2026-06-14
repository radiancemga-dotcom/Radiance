// ===========================================================================
// Edge Function: asaas-create-charge
// Cria um cliente + cobrança no Asaas para uma reserva e devolve o link de
// pagamento (Pix / boleto / cartão). Atualiza a reserva com payment_status
// = 'pending' e o payment_link.
//
// Secrets (Supabase > Edge Functions > Secrets):
//   ASAAS_API_KEY   -> chave da API Asaas
//   ASAAS_ENV       -> "production" ou "sandbox" (default: sandbox)
//
// Chamada: supabase.functions.invoke('asaas-create-charge', { body: { reservation_id } })
// ===========================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY") ?? "";
const ASAAS_BASE =
  (Deno.env.get("ASAAS_ENV") ?? "sandbox") === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function asaas(path: string, method: string, body?: unknown) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!ASAAS_API_KEY) return json({ error: "ASAAS_API_KEY não configurada." }, 400);

  try {
    const { reservation_id } = await req.json();
    if (!reservation_id) return json({ error: "reservation_id obrigatório." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: r } = await supabase.from("reservations").select("*").eq("id", reservation_id).maybeSingle();
    if (!r) return json({ error: "Reserva não encontrada." }, 404);

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", r.user_id).maybeSingle();

    // 1) cliente Asaas
    const customer = await asaas("/customers", "POST", {
      name: r.client_name,
      email: r.client_email,
      phone: (r.client_phone || "").replace(/\D/g, ""),
      cpfCnpj: (profile?.cpf || "").replace(/\D/g, ""),
    });
    if (!customer?.id) return json({ error: "Falha ao criar cliente Asaas", detail: customer }, 502);

    // 2) cobrança (cliente escolhe a forma de pagamento)
    const payment = await asaas("/payments", "POST", {
      customer: customer.id,
      billingType: "UNDEFINED",
      value: Number(r.price),
      dueDate: r.date,
      description: `Locação ${r.equipment_name || "Laser"} — ${r.city} (${r.date})`,
      externalReference: r.id,
    });
    if (!payment?.id) return json({ error: "Falha ao criar cobrança Asaas", detail: payment }, 502);

    const link = payment.invoiceUrl || payment.bankSlipUrl || "";
    await supabase
      .from("reservations")
      .update({ payment_status: "pending", payment_link: link })
      .eq("id", r.id);

    return json({ payment_link: link, asaas_payment_id: payment.id });
  } catch (err) {
    return json({ error: String(err) }, 400);
  }
});
