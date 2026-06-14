import { supabase, isSupabaseConfigured } from "./supabase";

/** Pagamentos só ficam ativos com Supabase configurado e o flag ligado. */
export const isPaymentsEnabled =
  isSupabaseConfigured && (import.meta.env.VITE_PAYMENTS_ENABLED ?? "false") === "true";

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  none: "Sem cobrança",
  pending: "Aguardando pagamento",
  paid: "Pago",
  refunded: "Reembolsado",
};

/** Cria uma cobrança no Asaas para a reserva e retorna o link de pagamento. */
export async function createCharge(reservationId: string): Promise<string> {
  if (!supabase) throw new Error("Pagamentos exigem Supabase configurado.");
  const { data, error } = await supabase.functions.invoke("asaas-create-charge", {
    body: { reservation_id: reservationId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.payment_link as string;
}
