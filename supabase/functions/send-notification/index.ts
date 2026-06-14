// ===========================================================================
// Edge Function: send-notification
// Envia e-mails transacionais via Resend (https://resend.com).
//
// Pode ser chamada de duas formas:
//  1) Diretamente pelo app (supabase.functions.invoke('send-notification', { body }))
//  2) Por um Database Webhook do Supabase na tabela `notifications` (INSERT)
//
// Secrets necessárias (Supabase > Edge Functions > Secrets):
//   RESEND_API_KEY            -> chave da API Resend
//   NOTIFICATION_FROM_EMAIL   -> ex.: "Radiance Laser <contato@radiancelaser.com.br>"
//   ADMIN_NOTIFICATION_EMAIL  -> e-mail que recebe avisos do admin
// ===========================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("NOTIFICATION_FROM_EMAIL") ?? "Radiance Laser <onboarding@resend.dev>";
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  type?: string;
  title?: string;
  body?: string;
  user_id?: string | null;
  to?: string;
  // formato de Database Webhook:
  record?: {
    type: string;
    title: string;
    body: string;
    user_id: string | null;
  };
}

async function resolveEmail(userId: string | null): Promise<string | null> {
  if (!userId) return ADMIN_EMAIL || null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return data?.email ?? null;
}

function emailHtml(title: string, body: string): string {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:#243b66;padding:24px 28px;color:#fff">
      <h1 style="margin:0;font-size:18px">Radiance <span style="color:#d8b46a">Laser</span></h1>
    </div>
    <div style="padding:28px">
      <h2 style="margin:0 0 12px;color:#0e1a33;font-size:18px">${title}</h2>
      <p style="margin:0;color:#475569;line-height:1.6;font-size:14px">${body}</p>
    </div>
    <div style="padding:16px 28px;background:#f8fafc;color:#94a3b8;font-size:12px">
      Radiance Laser · Maringá - PR · Este é um e-mail automático.
    </div>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload;
    const data = payload.record ?? payload;
    const title = data.title ?? "Notificação Radiance Laser";
    const body = data.body ?? "";
    const to = payload.to ?? (await resolveEmail(data.user_id ?? null));

    if (!to) {
      return new Response(JSON.stringify({ skipped: true, reason: "no recipient" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ skipped: true, reason: "RESEND_API_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject: title, html: emailHtml(title, body) }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ sent: res.ok, result }), {
      status: res.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
