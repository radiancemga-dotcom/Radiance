import { supabase } from "@/lib/supabase";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Backend, SignUpInput } from "./types";
import type { Profile, Reservation, Settings } from "@/types";

function sb() {
  if (!supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

export const supabaseBackend: Backend = {
  mode: "supabase",

  async getCurrentUser() {
    const { data } = await sb().auth.getUser();
    if (!data.user) return null;
    return { id: data.user.id, email: data.user.email ?? "" };
  },

  async signUp(input: SignUpInput) {
    const { data, error } = await sb().auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: input.full_name,
          cpf: input.cpf,
          crm: input.crm,
          specialty: input.specialty,
          clinic: input.clinic,
          phone: input.phone,
        },
      },
    });
    if (error) throw new Error(error.message);
    return {
      user: data.user ? { id: data.user.id, email: data.user.email ?? "" } : null,
      needsConfirmation: !data.session,
    };
  },

  async signIn(email, password) {
    const { data, error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { id: data.user.id, email: data.user.email ?? "" };
  },

  async signInWithGoogle() {
    const { error } = await sb().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) throw new Error(error.message);
  },

  async signOut() {
    await sb().auth.signOut();
  },

  async resetPassword(email) {
    const { error } = await sb().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw new Error(error.message);
  },

  onAuthChange(cb) {
    const { data } = sb().auth.onAuthStateChange((_e, session) => {
      cb(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
    });
    return () => data.subscription.unsubscribe();
  },

  async getProfile(userId) {
    const { data, error } = await sb().from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Profile) ?? null;
  },

  async updateProfile(userId, patch) {
    const { data, error } = await sb().from("profiles").update(patch).eq("id", userId).select().single();
    if (error) throw new Error(error.message);
    return data as Profile;
  },

  async listClients() {
    const { data, error } = await sb().from("profiles").select("*").eq("role", "client").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Profile[]) ?? [];
  },

  async setClientBlocked(userId, blocked) {
    const { error } = await sb().from("profiles").update({ blocked }).eq("id", userId);
    if (error) throw new Error(error.message);
  },

  async deleteClient(userId) {
    const { error } = await sb().from("profiles").delete().eq("id", userId);
    if (error) throw new Error(error.message);
  },

  async listReservations(opts) {
    let q = sb().from("reservations").select("*").order("date", { ascending: false });
    if (opts?.userId) q = q.eq("user_id", opts.userId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as Reservation[]) ?? [];
  },

  async getReservation(id) {
    const { data, error } = await sb().from("reservations").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Reservation) ?? null;
  },

  async reservationsOnDate(date, excludeId, equipmentId) {
    let q = sb().from("reservations").select("*").eq("date", date).neq("status", "cancelled");
    if (excludeId) q = q.neq("id", excludeId);
    if (equipmentId) q = q.eq("equipment_id", equipmentId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as Reservation[]) ?? [];
  },

  async getAvailability(equipmentId) {
    const { data, error } = await sb().rpc("get_availability", { p_equipment: equipmentId ?? null });
    if (error) throw new Error(error.message);
    return (data as Array<{ date: string; morning: boolean; afternoon: boolean }>) ?? [];
  },

  async createReservation(input) {
    const { data, error } = await sb().from("reservations").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as Reservation;
  },

  async updateReservation(id, patch, _actor) {
    const { data, error } = await sb().from("reservations").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return data as Reservation;
  },

  async listHistory(reservationId) {
    const { data, error } = await sb()
      .from("reservation_history")
      .select("*")
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async listCities() {
    const { data, error } = await sb().from("cities").select("*").order("distance_km", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async upsertCity(city) {
    const { data, error } = await sb().from("cities").upsert(city).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async setCityForceLong(id, value) {
    const { error } = await sb().from("cities").update({ force_long_distance: value }).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listNotifications({ userId, isAdmin }) {
    let q = sb().from("notifications").select("*").order("created_at", { ascending: false });
    q = isAdmin ? q.is("user_id", null) : q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async markNotificationRead(id) {
    const { error } = await sb().from("notifications").update({ read: true }).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async markAllNotificationsRead({ userId, isAdmin }) {
    let q = sb().from("notifications").update({ read: true });
    q = isAdmin ? q.is("user_id", null) : q.eq("user_id", userId);
    const { error } = await q;
    if (error) throw new Error(error.message);
  },

  async listFinancial() {
    const { data, error } = await sb().from("financial_records").select("*").order("month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async listAudit() {
    const { data, error } = await sb().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getSettings() {
    const { data, error } = await sb().from("settings").select("*").eq("id", "settings").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { id: "settings", ...DEFAULT_SETTINGS, updated_at: new Date().toISOString() } as Settings;
    return data as Settings;
  },

  async updateSettings(patch) {
    const { data, error } = await sb()
      .from("settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", "settings")
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Settings;
  },

  async listBlocks() {
    const { data, error } = await sb().from("schedule_blocks").select("*").order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async blocksOnDate(date) {
    const { data, error } = await sb().from("schedule_blocks").select("*").eq("date", date);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async addBlock(input) {
    const { data, error } = await sb().from("schedule_blocks").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async removeBlock(id) {
    const { error } = await sb().from("schedule_blocks").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listReviews() {
    const { data, error } = await sb().from("reviews").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async getReviewForReservation(reservationId) {
    const { data, error } = await sb().from("reviews").select("*").eq("reservation_id", reservationId).maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  },

  async addReview(input) {
    const { data, error } = await sb().from("reviews").insert(input).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async listEquipment() {
    const { data, error } = await sb().from("equipment").select("*").order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async upsertEquipment(e) {
    const { data, error } = await sb().from("equipment").upsert(e).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async removeEquipment(id) {
    const { error } = await sb().from("equipment").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listCoupons() {
    const { data, error } = await sb().from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async validateCoupon(code) {
    const { data, error } = await sb()
      .from("coupons")
      .select("*")
      .ilike("code", code.trim())
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (data.expires_at && data.expires_at < today) return null;
    return data;
  },

  async upsertCoupon(c) {
    const { data, error } = await sb()
      .from("coupons")
      .upsert({ ...c, code: c.code.trim().toUpperCase() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async removeCoupon(id) {
    const { error } = await sb().from("coupons").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
