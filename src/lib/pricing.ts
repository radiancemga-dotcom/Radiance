import type { Coupon, ReservationPeriod, Settings } from "@/types";

/**
 * Calcula o valor da reserva.
 * - Meio período (manhã/tarde): preço base.
 * - Integral: 2 × preço base com desconto automático configurável (padrão 10%).
 *   Ex.: 2 × 2000 = 4000 − 10% = R$ 3.600,00.
 */
export function calcPrice(period: ReservationPeriod, settings: Settings): number {
  const base = settings.price_half_period;
  if (period === "full") {
    const gross = base * 2;
    const discount = gross * (settings.full_day_discount_pct / 100);
    return Math.round((gross - discount) * 100) / 100;
  }
  return base;
}

export function priceBreakdown(period: ReservationPeriod, settings: Settings) {
  const base = settings.price_half_period;
  if (period === "full") {
    const gross = base * 2;
    const discount = gross * (settings.full_day_discount_pct / 100);
    return {
      gross,
      discount,
      discountPct: settings.full_day_discount_pct,
      total: gross - discount,
    };
  }
  return { gross: base, discount: 0, discountPct: 0, total: base };
}

/** Calcula o desconto de um cupom sobre um valor. */
export function couponDiscount(amount: number, coupon: Coupon | null): number {
  if (!coupon) return 0;
  const raw = coupon.discount_type === "percent" ? amount * (coupon.value / 100) : coupon.value;
  return Math.min(amount, Math.round(raw * 100) / 100);
}
