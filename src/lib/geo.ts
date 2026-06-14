import { ORIGIN } from "./constants";
import type { CepResult, GeoResult } from "@/types";

const GEO_PROVIDER = (import.meta.env.VITE_GEO_PROVIDER ?? "osm") as "osm" | "google";
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

/** Distância em linha reta (Haversine) — usada como fallback de rota. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Consulta endereço por CEP (ViaCEP — gratuito, sem chave). */
export async function lookupCep(cep: string): Promise<CepResult | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
      cep: clean.replace(/(\d{5})(\d{3})/, "$1-$2"),
    };
  } catch {
    return null;
  }
}

/** Geocodifica "cidade, estado" em coordenadas. */
async function geocode(query: string): Promise<{ lat: number; lng: number; city?: string; state?: string } | null> {
  if (GEO_PROVIDER === "google" && GOOGLE_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query,
      )}&key=${GOOGLE_KEY}&region=br`;
      const res = await fetch(url);
      const data = await res.json();
      const r = data.results?.[0];
      if (!r) return null;
      return { lat: r.geometry.location.lat, lng: r.geometry.location.lng };
    } catch {
      return null;
    }
  }
  // OSM Nominatim (gratuito)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
      query,
    )}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json();
    const r = data?.[0];
    if (!r) return null;
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
  } catch {
    return null;
  }
}

/** Distância e tempo de viagem por rodovia (OSRM gratuito; fallback Haversine ×1.3). */
async function route(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<{ km: number; minutes: number }> {
  if (GEO_PROVIDER === "google" && GOOGLE_KEY) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const el = data.rows?.[0]?.elements?.[0];
      if (el?.status === "OK") {
        return { km: el.distance.value / 1000, minutes: Math.round(el.duration.value / 60) };
      }
    } catch {
      /* fallthrough */
    }
  } else {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
      const res = await fetch(url);
      const data = await res.json();
      const r = data.routes?.[0];
      if (r) return { km: r.distance / 1000, minutes: Math.round(r.duration / 60) };
    } catch {
      /* fallthrough */
    }
  }
  // Fallback: distância em linha reta corrigida por fator rodoviário.
  const straight = haversineKm(fromLat, fromLng, toLat, toLng);
  const km = straight * 1.3;
  return { km: Math.round(km), minutes: Math.round((km / 80) * 60) };
}

/**
 * Calcula distância/tempo de Maringá até o destino.
 * Tenta geocodificar pelo endereço completo; cai para "cidade, estado".
 */
export async function calcDistanceFromOrigin(params: {
  address?: string;
  city: string;
  state: string;
  cep?: string;
}): Promise<GeoResult> {
  const queries = [
    params.cep ? params.cep.replace(/\D/g, "") + ", Brasil" : "",
    [params.address, params.city, params.state, "Brasil"].filter(Boolean).join(", "),
    [params.city, params.state, "Brasil"].filter(Boolean).join(", "),
  ].filter(Boolean);

  let geo: Awaited<ReturnType<typeof geocode>> = null;
  for (const q of queries) {
    geo = await geocode(q);
    if (geo) break;
  }
  if (!geo) {
    // Sem geocodificação: retorna zero (admin pode ajustar manualmente).
    return { lat: 0, lng: 0, distance_km: 0, travel_minutes: 0 };
  }

  const r = await route(ORIGIN.lat, ORIGIN.lng, geo.lat, geo.lng);
  return {
    lat: geo.lat,
    lng: geo.lng,
    distance_km: Math.round(r.km),
    travel_minutes: r.minutes,
    resolved_city: params.city,
    resolved_state: params.state,
  };
}
