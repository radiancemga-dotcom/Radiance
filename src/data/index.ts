import { DATA_MODE } from "@/lib/supabase";
import { mockBackend } from "./mockBackend";
import { supabaseBackend } from "./supabaseBackend";
import type { Backend } from "./types";

/** Backend ativo — escolhido automaticamente conforme a configuração do ambiente. */
export const db: Backend = DATA_MODE === "supabase" ? supabaseBackend : mockBackend;

export { DATA_MODE };
export type { Backend, SignUpInput, SessionUser } from "./types";
