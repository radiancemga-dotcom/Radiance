/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GEO_PROVIDER?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_COMPANY_PHONE?: string;
  readonly VITE_COMPANY_WHATSAPP?: string;
  readonly VITE_COMPANY_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
