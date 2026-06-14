import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/data";
import type {
  City,
  Coupon,
  Equipment,
  Profile,
  Reservation,
  Review,
  ScheduleBlock,
  Settings,
} from "@/types";

export const qk = {
  settings: ["settings"] as const,
  reservations: (userId?: string) => ["reservations", userId ?? "all"] as const,
  reservation: (id: string) => ["reservation", id] as const,
  clients: ["clients"] as const,
  cities: ["cities"] as const,
  notifications: (userId: string | null, isAdmin: boolean) => ["notifications", isAdmin ? "admin" : userId] as const,
  financial: ["financial"] as const,
  audit: ["audit"] as const,
  history: (id: string) => ["history", id] as const,
};

// ---- settings ----
export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: () => db.getSettings(), staleTime: 60_000 });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => db.updateSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.settings }),
  });
}

// ---- reservations ----
export function useReservations(userId?: string) {
  return useQuery({
    queryKey: qk.reservations(userId),
    queryFn: () => db.listReservations(userId ? { userId } : undefined),
  });
}

export function useAvailability(equipmentId?: string) {
  return useQuery({
    queryKey: ["availability", equipmentId ?? "all"],
    queryFn: () => db.getAvailability(equipmentId),
    staleTime: 20_000,
  });
}

export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: qk.reservation(id ?? ""),
    queryFn: () => db.getReservation(id!),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Reservation, "id" | "created_at" | "updated_at">) => db.createReservation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: qk.financial });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<Reservation>; actor: { id: string; name: string } }) =>
      db.updateReservation(args.id, args.patch, args.actor),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
      qc.invalidateQueries({ queryKey: qk.reservation(r.id) });
      qc.invalidateQueries({ queryKey: qk.history(r.id) });
      qc.invalidateQueries({ queryKey: qk.financial });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: qk.audit });
    },
  });
}

// ---- clients ----
export function useClients() {
  return useQuery({ queryKey: qk.clients, queryFn: () => db.listClients() });
}

export function useClientMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.clients });
  return {
    setBlocked: useMutation({
      mutationFn: (a: { id: string; blocked: boolean }) => db.setClientBlocked(a.id, a.blocked),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => db.deleteClient(id), onSuccess: invalidate }),
    update: useMutation({
      mutationFn: (a: { id: string; patch: Partial<Profile> }) => db.updateProfile(a.id, a.patch),
      onSuccess: invalidate,
    }),
  };
}

// ---- cities ----
export function useCities() {
  return useQuery({ queryKey: qk.cities, queryFn: () => db.listCities() });
}

export function useCityMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.cities });
  return {
    upsert: useMutation({
      mutationFn: (c: Omit<City, "id" | "created_at"> & { id?: string }) => db.upsertCity(c),
      onSuccess: invalidate,
    }),
    setForceLong: useMutation({
      mutationFn: (a: { id: string; value: boolean | null }) => db.setCityForceLong(a.id, a.value),
      onSuccess: invalidate,
    }),
  };
}

// ---- notifications ----
export function useNotifications(userId: string | null, isAdmin: boolean) {
  return useQuery({
    queryKey: qk.notifications(userId, isAdmin),
    queryFn: () => db.listNotifications({ userId, isAdmin }),
    refetchInterval: 30_000,
  });
}

export function useNotificationMutations(userId: string | null, isAdmin: boolean) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  return {
    markRead: useMutation({ mutationFn: (id: string) => db.markNotificationRead(id), onSuccess: invalidate }),
    markAll: useMutation({
      mutationFn: () => db.markAllNotificationsRead({ userId, isAdmin }),
      onSuccess: invalidate,
    }),
  };
}

// ---- financial ----
export function useFinancial() {
  return useQuery({ queryKey: qk.financial, queryFn: () => db.listFinancial() });
}

// ---- audit ----
export function useAudit() {
  return useQuery({ queryKey: qk.audit, queryFn: () => db.listAudit() });
}

// ---- schedule blocks ----
export function useBlocks() {
  return useQuery({ queryKey: ["blocks"], queryFn: () => db.listBlocks() });
}

export function useBlockMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["blocks"] });
    qc.invalidateQueries({ queryKey: ["availability"] });
  };
  return {
    add: useMutation({
      mutationFn: (b: Omit<ScheduleBlock, "id" | "created_at">) => db.addBlock(b),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => db.removeBlock(id), onSuccess: invalidate }),
  };
}

// ---- reviews ----
export function useReviews() {
  return useQuery({ queryKey: ["reviews"], queryFn: () => db.listReviews() });
}

export function useReview(reservationId: string | undefined) {
  return useQuery({
    queryKey: ["review", reservationId ?? ""],
    queryFn: () => db.getReviewForReservation(reservationId!),
    enabled: !!reservationId,
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Review, "id" | "created_at">) => db.addReview(input),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["review", r.reservation_id] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ---- equipment ----
export function useEquipment() {
  return useQuery({ queryKey: ["equipment"], queryFn: () => db.listEquipment() });
}

export function useEquipmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["equipment"] });
  return {
    upsert: useMutation({
      mutationFn: (e: Omit<Equipment, "id" | "created_at"> & { id?: string }) => db.upsertEquipment(e),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => db.removeEquipment(id), onSuccess: invalidate }),
  };
}

// ---- coupons ----
export function useCoupons() {
  return useQuery({ queryKey: ["coupons"], queryFn: () => db.listCoupons() });
}

export function useCouponMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["coupons"] });
  return {
    upsert: useMutation({
      mutationFn: (c: Omit<Coupon, "id" | "created_at"> & { id?: string }) => db.upsertCoupon(c),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: (id: string) => db.removeCoupon(id), onSuccess: invalidate }),
  };
}

// ---- history ----
export function useHistory(reservationId: string | undefined) {
  return useQuery({
    queryKey: qk.history(reservationId ?? ""),
    queryFn: () => db.listHistory(reservationId!),
    enabled: !!reservationId,
  });
}
