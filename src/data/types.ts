import type {
  AppNotification,
  AuditLog,
  City,
  Coupon,
  DayAvailability,
  Equipment,
  FinancialRecord,
  Profile,
  Reservation,
  ReservationHistory,
  Review,
  ScheduleBlock,
  Settings,
} from "@/types";

export interface SignUpInput {
  full_name: string;
  cpf: string;
  crm: string;
  specialty: string;
  clinic: string;
  email: string;
  phone: string;
  password: string;
}

export interface SessionUser {
  id: string;
  email: string;
}

export interface Backend {
  mode: "supabase" | "demo";

  // ---- auth ----
  getCurrentUser(): Promise<SessionUser | null>;
  signUp(input: SignUpInput): Promise<{ user: SessionUser | null; needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<SessionUser>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  onAuthChange(cb: (user: SessionUser | null) => void): () => void;

  // ---- profiles ----
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile>;
  listClients(): Promise<Profile[]>;
  setClientBlocked(userId: string, blocked: boolean): Promise<void>;
  deleteClient(userId: string): Promise<void>;

  // ---- reservations ----
  listReservations(opts?: { userId?: string }): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | null>;
  reservationsOnDate(date: string, excludeId?: string, equipmentId?: string): Promise<Reservation[]>;
  /** Ocupação agregada (sem dados pessoais) para o calendário de disponibilidade, por equipamento. */
  getAvailability(equipmentId?: string): Promise<DayAvailability[]>;
  createReservation(
    input: Omit<Reservation, "id" | "created_at" | "updated_at">,
  ): Promise<Reservation>;
  updateReservation(id: string, patch: Partial<Reservation>, actor: { id: string; name: string }): Promise<Reservation>;

  // ---- history ----
  listHistory(reservationId: string): Promise<ReservationHistory[]>;

  // ---- cities ----
  listCities(): Promise<City[]>;
  upsertCity(city: Omit<City, "id" | "created_at"> & { id?: string }): Promise<City>;
  setCityForceLong(id: string, value: boolean | null): Promise<void>;

  // ---- notifications ----
  listNotifications(opts: { userId: string | null; isAdmin: boolean }): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(opts: { userId: string | null; isAdmin: boolean }): Promise<void>;

  // ---- financial ----
  listFinancial(): Promise<FinancialRecord[]>;

  // ---- audit ----
  listAudit(): Promise<AuditLog[]>;

  // ---- settings ----
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // ---- schedule blocks (bloqueios do admin) ----
  listBlocks(): Promise<ScheduleBlock[]>;
  blocksOnDate(date: string): Promise<ScheduleBlock[]>;
  addBlock(input: Omit<ScheduleBlock, "id" | "created_at">): Promise<ScheduleBlock>;
  removeBlock(id: string): Promise<void>;

  // ---- reviews ----
  listReviews(): Promise<Review[]>;
  getReviewForReservation(reservationId: string): Promise<Review | null>;
  addReview(input: Omit<Review, "id" | "created_at">): Promise<Review>;

  // ---- equipment ----
  listEquipment(): Promise<Equipment[]>;
  upsertEquipment(e: Omit<Equipment, "id" | "created_at"> & { id?: string }): Promise<Equipment>;
  removeEquipment(id: string): Promise<void>;

  // ---- coupons ----
  listCoupons(): Promise<Coupon[]>;
  validateCoupon(code: string): Promise<Coupon | null>;
  upsertCoupon(c: Omit<Coupon, "id" | "created_at"> & { id?: string }): Promise<Coupon>;
  removeCoupon(id: string): Promise<void>;
}
