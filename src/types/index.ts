export type Role = "client" | "admin";

export type ReservationPeriod = "morning" | "afternoon" | "full";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  cpf: string;
  crm: string;
  specialty: string;
  clinic: string;
  email: string;
  phone: string;
  blocked: boolean;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
}

export type CouponType = "percent" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  discount_type: CouponType;
  value: number; // percentual (0-100) ou valor fixo em R$
  active: boolean;
  expires_at: string | null; // YYYY-MM-DD
  created_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  equipment_id: string;
  equipment_name: string;
  /** snapshot do solicitante para exibição no admin */
  client_name: string;
  client_email: string;
  client_phone: string;
  date: string; // YYYY-MM-DD
  period: ReservationPeriod;
  /** período efetivo após regra de logística (full quando long-distance) */
  effective_period: ReservationPeriod;
  clinic_name: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  procedures: string;
  notes: string;
  distance_km: number;
  travel_minutes: number;
  is_long_distance: boolean;
  price: number;
  coupon_code: string;
  discount_amount: number;
  payment_status: PaymentStatus;
  payment_link: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "none" | "pending" | "paid" | "refunded";

export interface ReservationHistory {
  id: string;
  reservation_id: string;
  changed_by: string;
  changed_by_name: string;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  distance_km: number;
  /** sobrescreve a regra automática de longa distância quando definido */
  force_long_distance: boolean | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string | null; // null = destinada ao admin
  type: string;
  title: string;
  body: string;
  read: boolean;
  reservation_id: string | null;
  created_at: string;
}

export interface FinancialRecord {
  id: string;
  reservation_id: string;
  user_id: string;
  client_name: string;
  city: string;
  amount: number;
  status: "forecast" | "received";
  month: string; // YYYY-MM
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: string;
  created_at: string;
}

export interface Settings {
  id: string;
  price_half_period: number;
  full_day_discount_pct: number;
  long_distance_km: number;
  mid_distance_km: number;
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
  company_name: string;
  company_phone: string;
  company_whatsapp: string;
  company_email: string;
  updated_at: string;
}

export interface GeoResult {
  lat: number;
  lng: number;
  distance_km: number;
  travel_minutes: number;
  resolved_city?: string;
  resolved_state?: string;
}

export interface ScheduleBlock {
  id: string;
  date: string; // YYYY-MM-DD
  period: ReservationPeriod; // manhã/tarde/integral
  reason: string;
  created_at: string;
}

export interface Review {
  id: string;
  reservation_id: string;
  user_id: string;
  client_name: string;
  city: string;
  rating: number; // 1..5
  comment: string;
  created_at: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  morning: boolean; // período da manhã ocupado
  afternoon: boolean; // período da tarde ocupado
}

export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}
