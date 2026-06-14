import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const forceMock = (import.meta.env.VITE_USE_MOCK ?? "false") === "true";

/** Há credenciais Supabase válidas e o modo mock não foi forçado? */
export const isSupabaseConfigured = Boolean(url && anonKey) && !forceMock;

/** Modo de operação atual do app. */
export const DATA_MODE: "supabase" | "demo" = isSupabaseConfigured ? "supabase" : "demo";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
