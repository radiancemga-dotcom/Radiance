import type { ReservationPeriod, ReservationStatus } from "@/types";

/** Origem da logística — sede da Radiance Laser. */
export const ORIGIN = {
  city: "Maringá",
  state: "PR",
  lat: -23.4253,
  lng: -51.9386,
};

export const COMPANY = {
  name: "Radiance Laser",
  equipment: "DEKA DUOGlide",
  phone: import.meta.env.VITE_COMPANY_PHONE ?? "(44) 99162-9494",
  whatsapp: import.meta.env.VITE_COMPANY_WHATSAPP ?? "5544991629494",
  email: import.meta.env.VITE_COMPANY_EMAIL ?? "radiancemga@gmail.com",
  instagram: "radiancemga",
  city: "Maringá - PR",
};

export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá, gostaria de informações sobre a locação do laser DEKA DUOGlide.";

export const PERIODS: Record<
  ReservationPeriod,
  { label: string; hours: string; short: string }
> = {
  morning: { label: "Manhã", hours: "07h00 às 12h00", short: "Manhã" },
  afternoon: { label: "Tarde", hours: "13h00 às 18h00", short: "Tarde" },
  full: { label: "Integral", hours: "07h00 às 18h00", short: "Integral" },
};

export const STATUS_META: Record<
  ReservationStatus,
  { label: string; color: string; calendar: string }
> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-200", calendar: "#f59e0b" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-800 border-blue-200", calendar: "#2563eb" },
  in_transit: { label: "Em Transporte", color: "bg-violet-100 text-violet-800 border-violet-200", calendar: "#7c3aed" },
  completed: { label: "Concluída", color: "bg-emerald-100 text-emerald-800 border-emerald-200", calendar: "#059669" },
  cancelled: { label: "Cancelada", color: "bg-rose-100 text-rose-700 border-rose-200", calendar: "#e11d48" },
};

/** Configurações padrão (sobrescritas pelo registro `settings` do banco). */
export const DEFAULT_SETTINGS = {
  price_half_period: 2000,
  full_day_discount_pct: 10, // desconto sobre 2 meios períodos
  long_distance_km: 250, // acima disso, bloqueia o dia inteiro
  mid_distance_km: 100,
  morning_start: "07:00",
  morning_end: "12:00",
  afternoon_start: "13:00",
  afternoon_end: "18:00",
  company_name: COMPANY.name,
  company_phone: COMPANY.phone,
  company_whatsapp: COMPANY.whatsapp,
  company_email: COMPANY.email,
};

export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export const SPECIALTIES = [
  "Dermatologia",
  "Cirurgia Plástica",
  "Ginecologia",
  "Medicina Estética",
  "Angiologia",
  "Cirurgia Vascular",
  "Otorrinolaringologia",
  "Outra",
];
