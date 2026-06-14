import { DEFAULT_SETTINGS } from "@/lib/constants";
import { genId } from "@/lib/utils";
import type { Backend, SessionUser, SignUpInput } from "./types";
import type {
  AppNotification,
  AuditLog,
  City,
  Coupon,
  Equipment,
  FinancialRecord,
  Profile,
  Reservation,
  ReservationHistory,
  Review,
  ScheduleBlock,
  Settings,
} from "@/types";

const KEY = "radiance_db_v5";
const SESSION_KEY = "radiance_session_v1";

interface DBShape {
  passwords: Record<string, string>; // userId -> password
  profiles: Profile[];
  reservations: Reservation[];
  history: ReservationHistory[];
  cities: City[];
  notifications: AppNotification[];
  financial: FinancialRecord[];
  audit: AuditLog[];
  settings: Settings;
  blocks: ScheduleBlock[];
  reviews: Review[];
  equipment: Equipment[];
  coupons: Coupon[];
}

function nowISO() {
  return new Date().toISOString();
}

function ymd(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function monthOf(date: string): string {
  return date.slice(0, 7);
}

// --------------------------------------------------------------------------
// Seed
// --------------------------------------------------------------------------
function seed(): DBShape {
  const settings: Settings = {
    id: "settings",
    ...DEFAULT_SETTINGS,
    updated_at: nowISO(),
  };

  const adminId = "user_admin";
  const clientId = "user_demo";

  const profiles: Profile[] = [
    {
      id: adminId,
      role: "admin",
      full_name: "Administração Radiance",
      cpf: "000.000.000-00",
      crm: "—",
      specialty: "—",
      clinic: "Radiance Laser",
      email: "admin@radiancelaser.com.br",
      phone: "(44) 99999-9999",
      blocked: false,
      created_at: nowISO(),
    },
    {
      id: clientId,
      role: "client",
      full_name: "Dra. Marina Souza",
      cpf: "123.456.789-09",
      crm: "CRM-PR 54321",
      specialty: "Dermatologia",
      clinic: "Clínica Derma Souza",
      email: "cliente@demo.com",
      phone: "(44) 98888-7777",
      blocked: false,
      created_at: nowISO(),
    },
  ];

  const cities: City[] = [
    { id: genId("city"), name: "Maringá", state: "PR", lat: -23.4253, lng: -51.9386, distance_km: 0, force_long_distance: null, created_at: nowISO() },
    { id: genId("city"), name: "Sarandi", state: "PR", lat: -23.4435, lng: -51.8762, distance_km: 12, force_long_distance: null, created_at: nowISO() },
    { id: genId("city"), name: "Londrina", state: "PR", lat: -23.3045, lng: -51.1696, distance_km: 100, force_long_distance: null, created_at: nowISO() },
    { id: genId("city"), name: "Cascavel", state: "PR", lat: -24.9555, lng: -53.4552, distance_km: 290, force_long_distance: null, created_at: nowISO() },
    { id: genId("city"), name: "Curitiba", state: "PR", lat: -25.4284, lng: -49.2733, distance_km: 430, force_long_distance: null, created_at: nowISO() },
  ];

  const equipment: Equipment[] = [
    { id: "eq_duoglide", name: "DEKA DUOGlide", description: "CO₂ fracionado híbrido (10600 nm + 1540 nm) — rejuvenescimento, cicatrizes e ginecologia.", active: true, created_at: nowISO() },
  ];

  const coupons: Coupon[] = [
    { id: genId("cup"), code: "BEMVINDO10", discount_type: "percent", value: 10, active: true, expires_at: null, created_at: nowISO() },
    { id: genId("cup"), code: "PARCEIRO200", discount_type: "fixed", value: 200, active: true, expires_at: null, created_at: nowISO() },
  ];

  const baseRes = (over: Partial<Reservation>): Reservation => ({
    id: genId("res"),
    user_id: clientId,
    equipment_id: "eq_duoglide",
    equipment_name: "DEKA DUOGlide",
    client_name: "Dra. Marina Souza",
    client_email: "cliente@demo.com",
    client_phone: "(44) 98888-7777",
    date: ymd(5),
    period: "morning",
    effective_period: "morning",
    clinic_name: "Clínica Derma Souza",
    address: "Av. Brasil, 1200",
    city: "Maringá",
    state: "PR",
    cep: "87013-000",
    procedures: "Depilação a laser, rejuvenescimento",
    notes: "",
    distance_km: 0,
    travel_minutes: 0,
    is_long_distance: false,
    price: settings.price_half_period,
    coupon_code: "",
    discount_amount: 0,
    payment_status: "none",
    payment_link: "",
    status: "pending",
    created_at: nowISO(),
    updated_at: nowISO(),
    ...over,
  });

  const reservations: Reservation[] = [
    baseRes({ date: ymd(3), period: "morning", effective_period: "morning", status: "confirmed", city: "Maringá", distance_km: 0 }),
    baseRes({
      date: ymd(7), period: "full", effective_period: "full", status: "pending", city: "Londrina",
      address: "Av. Higienópolis, 500", cep: "86020-080", distance_km: 100, travel_minutes: 90,
      price: settings.price_half_period * 2 * (1 - settings.full_day_discount_pct / 100),
    }),
    baseRes({
      date: ymd(12), period: "full", effective_period: "full", status: "confirmed", city: "Cascavel",
      address: "Rua Paraná, 3000", cep: "85810-010", distance_km: 290, travel_minutes: 210, is_long_distance: true,
      price: settings.price_half_period * 2 * (1 - settings.full_day_discount_pct / 100),
    }),
    baseRes({ date: ymd(-10), period: "afternoon", effective_period: "afternoon", status: "completed", city: "Sarandi", distance_km: 12, travel_minutes: 20 }),
    baseRes({ date: ymd(-25), period: "morning", effective_period: "morning", status: "completed", city: "Maringá" }),
  ];

  const financial: FinancialRecord[] = reservations
    .filter((r) => r.status !== "cancelled")
    .map((r) => ({
      id: genId("fin"),
      reservation_id: r.id,
      user_id: r.user_id,
      client_name: r.client_name,
      city: r.city,
      amount: r.price,
      status: r.status === "completed" ? "received" : "forecast",
      month: monthOf(r.date),
      created_at: nowISO(),
    }));

  const notifications: AppNotification[] = [
    {
      id: genId("ntf"), user_id: clientId, type: "reservation_created", title: "Reserva criada",
      body: "Sua reserva para " + reservations[0].city + " foi registrada e está pendente de aprovação.",
      read: false, reservation_id: reservations[0].id, created_at: nowISO(),
    },
    {
      id: genId("ntf"), user_id: null, type: "reservation_created", title: "Nova reserva recebida",
      body: "Dra. Marina Souza solicitou uma reserva.", read: false, reservation_id: reservations[1].id, created_at: nowISO(),
    },
  ];

  return {
    passwords: { [adminId]: "admin123", [clientId]: "demo123" },
    profiles,
    reservations,
    history: [],
    cities,
    notifications,
    financial,
    audit: [],
    settings,
    blocks: [],
    reviews: [],
    equipment,
    coupons,
  };
}

// --------------------------------------------------------------------------
// Persistence
// --------------------------------------------------------------------------
let cache: DBShape | null = null;

function load(): DBShape {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      cache = JSON.parse(raw) as DBShape;
      return cache;
    }
  } catch {
    /* ignore */
  }
  cache = seed();
  persist();
  return cache;
}

function persist() {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function setSession(u: SessionUser | null) {
  if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  else localStorage.removeItem(SESSION_KEY);
  authListeners.forEach((cb) => cb(u));
}

const authListeners: Array<(u: SessionUser | null) => void> = [];

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function pushNotification(db: DBShape, n: Omit<AppNotification, "id" | "created_at" | "read">) {
  db.notifications.unshift({ ...n, id: genId("ntf"), read: false, created_at: nowISO() });
}

function pushAudit(db: DBShape, log: Omit<AuditLog, "id" | "created_at">) {
  db.audit.unshift({ ...log, id: genId("aud"), created_at: nowISO() });
}

// --------------------------------------------------------------------------
// Backend implementation
// --------------------------------------------------------------------------
export const mockBackend: Backend = {
  mode: "demo",

  async getCurrentUser() {
    return delay(getSession());
  },

  async signUp(input: SignUpInput) {
    const db = load();
    if (db.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("Já existe uma conta com este e-mail.");
    }
    const id = genId("user");
    const profile: Profile = {
      id,
      role: "client",
      full_name: input.full_name,
      cpf: input.cpf,
      crm: input.crm,
      specialty: input.specialty,
      clinic: input.clinic,
      email: input.email,
      phone: input.phone,
      blocked: false,
      created_at: nowISO(),
    };
    db.profiles.push(profile);
    db.passwords[id] = input.password;
    pushNotification(db, {
      user_id: null,
      type: "user_registered",
      title: "Novo cadastro",
      body: `${input.full_name} criou uma conta.`,
      reservation_id: null,
    });
    pushNotification(db, {
      user_id: id,
      type: "welcome",
      title: "Bem-vindo(a) à Radiance Laser",
      body: "Seu cadastro foi concluído. Já pode realizar sua primeira reserva.",
      reservation_id: null,
    });
    pushAudit(db, { actor_id: id, actor_name: input.full_name, action: "signup", entity: "profile", entity_id: id, detail: "Cadastro de cliente" });
    persist();
    const user = { id, email: input.email };
    setSession(user);
    return delay({ user, needsConfirmation: false });
  },

  async signIn(email, password) {
    const db = load();
    const profile = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile || db.passwords[profile.id] !== password) {
      throw new Error("E-mail ou senha inválidos.");
    }
    if (profile.blocked) throw new Error("Sua conta está bloqueada. Entre em contato com a Radiance Laser.");
    const user = { id: profile.id, email: profile.email };
    setSession(user);
    return delay(user);
  },

  async signInWithGoogle() {
    throw new Error("Login com Google disponível apenas com Supabase configurado. No modo demo, use e-mail e senha.");
  },

  async signOut() {
    setSession(null);
    return delay(undefined);
  },

  async resetPassword(email) {
    const db = load();
    const profile = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (profile) {
      pushNotification(db, {
        user_id: profile.id,
        type: "password_reset",
        title: "Recuperação de senha",
        body: "Recebemos sua solicitação de recuperação de senha.",
        reservation_id: null,
      });
      persist();
    }
    return delay(undefined);
  },

  onAuthChange(cb) {
    authListeners.push(cb);
    return () => {
      const i = authListeners.indexOf(cb);
      if (i >= 0) authListeners.splice(i, 1);
    };
  },

  async getProfile(userId) {
    const db = load();
    return delay(db.profiles.find((p) => p.id === userId) ?? null);
  },

  async updateProfile(userId, patch) {
    const db = load();
    const idx = db.profiles.findIndex((p) => p.id === userId);
    if (idx < 0) throw new Error("Perfil não encontrado.");
    db.profiles[idx] = { ...db.profiles[idx], ...patch, id: userId };
    pushAudit(db, { actor_id: userId, actor_name: db.profiles[idx].full_name, action: "update", entity: "profile", entity_id: userId, detail: "Atualização de perfil" });
    persist();
    return delay(db.profiles[idx]);
  },

  async listClients() {
    const db = load();
    return delay(db.profiles.filter((p) => p.role === "client").sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async setClientBlocked(userId, blocked) {
    const db = load();
    const p = db.profiles.find((x) => x.id === userId);
    if (p) {
      p.blocked = blocked;
      pushAudit(db, { actor_id: "admin", actor_name: "Admin", action: blocked ? "block" : "unblock", entity: "profile", entity_id: userId, detail: `${blocked ? "Bloqueou" : "Reativou"} ${p.full_name}` });
      persist();
    }
    return delay(undefined);
  },

  async deleteClient(userId) {
    const db = load();
    db.profiles = db.profiles.filter((p) => p.id !== userId);
    pushAudit(db, { actor_id: "admin", actor_name: "Admin", action: "delete", entity: "profile", entity_id: userId, detail: "Exclusão de cliente" });
    persist();
    return delay(undefined);
  },

  async listReservations(opts) {
    const db = load();
    let list = [...db.reservations];
    if (opts?.userId) list = list.filter((r) => r.user_id === opts.userId);
    list.sort((a, b) => b.date.localeCompare(a.date));
    return delay(list);
  },

  async getReservation(id) {
    const db = load();
    return delay(db.reservations.find((r) => r.id === id) ?? null);
  },

  async reservationsOnDate(date, excludeId, equipmentId) {
    const db = load();
    return delay(
      db.reservations.filter(
        (r) =>
          r.date === date &&
          r.status !== "cancelled" &&
          r.id !== excludeId &&
          (!equipmentId || r.equipment_id === equipmentId),
      ),
    );
  },

  async getAvailability(equipmentId) {
    const db = load();
    const map = new Map<string, { morning: boolean; afternoon: boolean }>();
    for (const r of db.reservations) {
      if (r.status === "cancelled") continue;
      if (equipmentId && r.equipment_id !== equipmentId) continue;
      const cur = map.get(r.date) ?? { morning: false, afternoon: false };
      if (r.is_long_distance || r.effective_period === "full") {
        cur.morning = true;
        cur.afternoon = true;
      } else if (r.effective_period === "morning") {
        cur.morning = true;
      } else if (r.effective_period === "afternoon") {
        cur.afternoon = true;
      }
      map.set(r.date, cur);
    }
    // bloqueios do admin também ocupam slots
    for (const b of db.blocks) {
      const cur = map.get(b.date) ?? { morning: false, afternoon: false };
      if (b.period === "full") {
        cur.morning = true;
        cur.afternoon = true;
      } else if (b.period === "morning") {
        cur.morning = true;
      } else if (b.period === "afternoon") {
        cur.afternoon = true;
      }
      map.set(b.date, cur);
    }
    return delay(Array.from(map.entries()).map(([date, v]) => ({ date, ...v })));
  },

  async listBlocks() {
    const db = load();
    return delay([...db.blocks].sort((a, b) => a.date.localeCompare(b.date)));
  },

  async blocksOnDate(date) {
    const db = load();
    return delay(db.blocks.filter((b) => b.date === date));
  },

  async addBlock(input) {
    const db = load();
    const block: ScheduleBlock = { ...input, id: genId("blk"), created_at: nowISO() };
    db.blocks.push(block);
    pushAudit(db, { actor_id: "admin", actor_name: "Admin", action: "create", entity: "schedule_block", entity_id: block.id, detail: `Bloqueio ${block.date} (${block.period})` });
    persist();
    return delay(block);
  },

  async removeBlock(id) {
    const db = load();
    db.blocks = db.blocks.filter((b) => b.id !== id);
    persist();
    return delay(undefined);
  },

  async listReviews() {
    const db = load();
    return delay([...db.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async getReviewForReservation(reservationId) {
    const db = load();
    return delay(db.reviews.find((r) => r.reservation_id === reservationId) ?? null);
  },

  async addReview(input) {
    const db = load();
    const review: Review = { ...input, id: genId("rev"), created_at: nowISO() };
    db.reviews.push(review);
    pushNotification(db, { user_id: null, type: "review", title: "Nova avaliação", body: `${input.client_name} avaliou com ${input.rating} estrela(s).`, reservation_id: input.reservation_id });
    persist();
    return delay(review);
  },

  async listEquipment() {
    const db = load();
    return delay([...db.equipment].sort((a, b) => a.name.localeCompare(b.name)));
  },

  async upsertEquipment(e) {
    const db = load();
    if (e.id) {
      const idx = db.equipment.findIndex((x) => x.id === e.id);
      if (idx >= 0) {
        db.equipment[idx] = { ...db.equipment[idx], ...e } as Equipment;
        persist();
        return delay(db.equipment[idx]);
      }
    }
    const created: Equipment = { ...e, id: genId("eq"), created_at: nowISO() } as Equipment;
    db.equipment.push(created);
    persist();
    return delay(created);
  },

  async removeEquipment(id) {
    const db = load();
    db.equipment = db.equipment.filter((e) => e.id !== id);
    persist();
    return delay(undefined);
  },

  async listCoupons() {
    const db = load();
    return delay([...db.coupons].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },

  async validateCoupon(code) {
    const db = load();
    const c = db.coupons.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    if (!c || !c.active) return delay(null);
    if (c.expires_at && c.expires_at < nowISO().slice(0, 10)) return delay(null);
    return delay(c);
  },

  async upsertCoupon(c) {
    const db = load();
    const code = c.code.trim().toUpperCase();
    if (c.id) {
      const idx = db.coupons.findIndex((x) => x.id === c.id);
      if (idx >= 0) {
        db.coupons[idx] = { ...db.coupons[idx], ...c, code } as Coupon;
        persist();
        return delay(db.coupons[idx]);
      }
    }
    const created: Coupon = { ...c, code, id: genId("cup"), created_at: nowISO() } as Coupon;
    db.coupons.push(created);
    persist();
    return delay(created);
  },

  async removeCoupon(id) {
    const db = load();
    db.coupons = db.coupons.filter((c) => c.id !== id);
    persist();
    return delay(undefined);
  },

  async createReservation(input) {
    const db = load();
    const res: Reservation = { ...input, id: genId("res"), created_at: nowISO(), updated_at: nowISO() };
    db.reservations.push(res);
    db.financial.push({
      id: genId("fin"),
      reservation_id: res.id,
      user_id: res.user_id,
      client_name: res.client_name,
      city: res.city,
      amount: res.price,
      status: "forecast",
      month: monthOf(res.date),
      created_at: nowISO(),
    });
    pushNotification(db, { user_id: res.user_id, type: "reservation_created", title: "Reserva criada", body: `Sua reserva para ${res.city} em ${res.date} foi registrada (pendente de aprovação).`, reservation_id: res.id });
    pushNotification(db, { user_id: null, type: "reservation_created", title: "Nova reserva recebida", body: `${res.client_name} solicitou uma reserva em ${res.city}.`, reservation_id: res.id });
    pushAudit(db, { actor_id: res.user_id, actor_name: res.client_name, action: "create", entity: "reservation", entity_id: res.id, detail: `Reserva ${res.city} ${res.date}` });
    persist();
    return delay(res);
  },

  async updateReservation(id, patch, actor) {
    const db = load();
    const idx = db.reservations.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Reserva não encontrada.");
    const old = db.reservations[idx];

    // histórico de alterações campo a campo
    const tracked: (keyof Reservation)[] = ["status", "date", "period", "effective_period", "address", "city", "state", "cep", "price"];
    for (const field of tracked) {
      if (field in patch && String(patch[field]) !== String(old[field])) {
        db.history.unshift({
          id: genId("hist"),
          reservation_id: id,
          changed_by: actor.id,
          changed_by_name: actor.name,
          field: String(field),
          old_value: String(old[field] ?? ""),
          new_value: String(patch[field] ?? ""),
          created_at: nowISO(),
        });
      }
    }

    const updated = { ...old, ...patch, id, updated_at: nowISO() };
    db.reservations[idx] = updated;

    // sincroniza financeiro — reserva cancelada não conta na previsão de receita
    if (updated.status === "cancelled") {
      db.financial = db.financial.filter((f) => f.reservation_id !== id);
    } else {
      const fin = db.financial.find((f) => f.reservation_id === id);
      if (fin) {
        fin.amount = updated.price;
        fin.city = updated.city;
        fin.month = monthOf(updated.date);
        fin.status = updated.status === "completed" ? "received" : "forecast";
      }
    }

    // notificações por mudança de status
    if (patch.status && patch.status !== old.status) {
      const map: Record<string, string> = {
        confirmed: "Sua reserva foi aprovada!",
        in_transit: "Seu equipamento está em transporte.",
        completed: "Sua reserva foi concluída. Obrigado!",
        cancelled: "Sua reserva foi cancelada.",
        pending: "Sua reserva voltou para pendente.",
      };
      pushNotification(db, { user_id: updated.user_id, type: `reservation_${patch.status}`, title: "Atualização da reserva", body: `${map[patch.status]} (${updated.city} — ${updated.date})`, reservation_id: id });
    } else if (Object.keys(patch).some((k) => k !== "status")) {
      pushNotification(db, { user_id: updated.user_id, type: "reservation_updated", title: "Reserva alterada", body: `Sua reserva em ${updated.city} foi alterada.`, reservation_id: id });
    }

    pushAudit(db, { actor_id: actor.id, actor_name: actor.name, action: "update", entity: "reservation", entity_id: id, detail: patch.status ? `Status → ${patch.status}` : "Alteração de reserva" });
    persist();
    return delay(updated);
  },

  async listHistory(reservationId) {
    const db = load();
    return delay(db.history.filter((h) => h.reservation_id === reservationId));
  },

  async listCities() {
    const db = load();
    return delay([...db.cities].sort((a, b) => a.distance_km - b.distance_km));
  },

  async upsertCity(city) {
    const db = load();
    if (city.id) {
      const idx = db.cities.findIndex((c) => c.id === city.id);
      if (idx >= 0) {
        db.cities[idx] = { ...db.cities[idx], ...city } as City;
        persist();
        return delay(db.cities[idx]);
      }
    }
    const created: City = { ...city, id: genId("city"), created_at: nowISO() } as City;
    db.cities.push(created);
    persist();
    return delay(created);
  },

  async setCityForceLong(id, value) {
    const db = load();
    const c = db.cities.find((x) => x.id === id);
    if (c) {
      c.force_long_distance = value;
      pushAudit(db, { actor_id: "admin", actor_name: "Admin", action: "update", entity: "city", entity_id: id, detail: `Regra de logística de ${c.name} = ${value === null ? "automática" : value ? "dia inteiro" : "por período"}` });
      persist();
    }
    return delay(undefined);
  },

  async listNotifications({ userId, isAdmin }) {
    const db = load();
    const list = db.notifications.filter((n) => (isAdmin ? n.user_id === null : n.user_id === userId));
    return delay(list);
  },

  async markNotificationRead(id) {
    const db = load();
    const n = db.notifications.find((x) => x.id === id);
    if (n) {
      n.read = true;
      persist();
    }
    return delay(undefined);
  },

  async markAllNotificationsRead({ userId, isAdmin }) {
    const db = load();
    db.notifications.forEach((n) => {
      if (isAdmin ? n.user_id === null : n.user_id === userId) n.read = true;
    });
    persist();
    return delay(undefined);
  },

  async listFinancial() {
    const db = load();
    return delay([...db.financial].sort((a, b) => b.month.localeCompare(a.month)));
  },

  async listAudit() {
    const db = load();
    return delay([...db.audit].slice(0, 200));
  },

  async getSettings() {
    const db = load();
    return delay(db.settings);
  },

  async updateSettings(patch) {
    const db = load();
    db.settings = { ...db.settings, ...patch, id: "settings", updated_at: nowISO() };
    pushAudit(db, { actor_id: "admin", actor_name: "Admin", action: "update", entity: "settings", entity_id: "settings", detail: "Configurações atualizadas" });
    persist();
    return delay(db.settings);
  },
};

/** Reseta o banco demo (útil para testes/desenvolvimento). */
export function resetMockDb() {
  cache = seed();
  persist();
}
