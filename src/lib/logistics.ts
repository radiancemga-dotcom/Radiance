import type { Reservation, ReservationPeriod, Settings } from "@/types";

export interface LogisticsRule {
  isLongDistance: boolean;
  /** período efetivo que a reserva irá ocupar */
  effectivePeriod: ReservationPeriod;
  /** períodos bloqueados naquele dia por causa desta reserva */
  blockedPeriods: ReservationPeriod[];
  tier: "near" | "mid" | "far";
  message: string;
}

/**
 * Aplica as regras de logística com base na distância.
 * - Até `mid_distance_km` (100): reserva normal por período (tier near).
 * - Entre 101 e `long_distance_km` (250): reserva normal por período (tier mid).
 * - Acima de `long_distance_km` (250): ocupa o dia inteiro — bloqueia manhã e tarde.
 *
 * `forceLongDistance` (vindo do cadastro manual da cidade pelo admin) sobrescreve
 * a regra automática quando definido (true/false).
 */
export function applyLogistics(
  distanceKm: number,
  requestedPeriod: ReservationPeriod,
  settings: Settings,
  forceLongDistance: boolean | null = null,
): LogisticsRule {
  const auto = distanceKm > settings.long_distance_km;
  const isLong = forceLongDistance === null ? auto : forceLongDistance;

  let tier: LogisticsRule["tier"] = "near";
  if (distanceKm > settings.long_distance_km) tier = "far";
  else if (distanceKm > settings.mid_distance_km) tier = "mid";

  if (isLong) {
    return {
      isLongDistance: true,
      effectivePeriod: "full",
      blockedPeriods: ["morning", "afternoon", "full"],
      tier,
      message: `Acima de ${settings.long_distance_km} km: a reserva ocupa o dia inteiro (manhã e tarde ficam indisponíveis).`,
    };
  }

  const blocked: ReservationPeriod[] =
    requestedPeriod === "full"
      ? ["morning", "afternoon", "full"]
      : [requestedPeriod, "full"];

  return {
    isLongDistance: false,
    effectivePeriod: requestedPeriod,
    blockedPeriods: blocked,
    tier,
    message:
      tier === "mid"
        ? `Entre ${settings.mid_distance_km + 1} e ${settings.long_distance_km} km: reserva normal por período.`
        : `Até ${settings.mid_distance_km} km: reserva normal por período.`,
  };
}

/**
 * Verifica se há conflito de agenda entre a nova reserva e as existentes (mesma data).
 * Reservas canceladas são ignoradas pelo chamador.
 */
export function hasConflict(
  newRule: LogisticsRule,
  existing: Array<Pick<Reservation, "effective_period" | "is_long_distance">>,
): boolean {
  const wanted = new Set(
    newRule.isLongDistance ? (["morning", "afternoon"] as ReservationPeriod[]) : effectiveSlots(newRule.effectivePeriod),
  );
  for (const r of existing) {
    const occ = r.is_long_distance ? (["morning", "afternoon"] as ReservationPeriod[]) : effectiveSlots(r.effective_period);
    if (occ.some((p) => wanted.has(p))) return true;
  }
  return false;
}

/** Converte um período em "slots" físicos de manhã/tarde. */
function effectiveSlots(period: ReservationPeriod): ReservationPeriod[] {
  if (period === "full") return ["morning", "afternoon"];
  return [period];
}
