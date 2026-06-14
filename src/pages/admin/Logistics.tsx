import * as React from "react";
import { toast } from "sonner";
import { ExternalLink, FileText, MapPin, Plus, Route, Truck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, PageHeader, PageLoader, StatCard } from "@/components/shared/common";
import { useCities, useCityMutations, useReservations, useSettings } from "@/hooks/api";
import { calcDistanceFromOrigin } from "@/lib/geo";
import { BR_STATES, ORIGIN } from "@/lib/constants";
import { formatNumber, todayISO } from "@/lib/utils";
import { exportLogisticsPDF } from "@/lib/export";

export default function AdminLogistics() {
  const { data: cities = [], isLoading } = useCities();
  const { data: reservations = [] } = useReservations();
  const { data: settings } = useSettings();
  const { upsert, setForceLong } = useCityMutations();
  const [addOpen, setAddOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", state: "PR" });
  const [saving, setSaving] = React.useState(false);

  if (isLoading || !settings) return <PageLoader />;

  const activeRes = reservations.filter((r) => r.status !== "cancelled");
  const year = todayISO().slice(0, 4);
  const month = todayISO().slice(0, 7);
  const kmRoundTrip = (d: number) => d * 2;
  const kmMonth = activeRes.filter((r) => r.date.slice(0, 7) === month).reduce((s, r) => s + kmRoundTrip(r.distance_km), 0);
  const kmYear = activeRes.filter((r) => r.date.slice(0, 4) === year).reduce((s, r) => s + kmRoundTrip(r.distance_km), 0);
  const citiesServed = new Set(activeRes.map((r) => `${r.city}-${r.state}`)).size;

  const ruleOf = (force: boolean | null, distance: number) => {
    if (force === true) return { label: "Dia inteiro (manual)", cls: "text-amber-700" };
    if (force === false) return { label: "Por período (manual)", cls: "text-blue-700" };
    if (distance > settings.long_distance_km) return { label: "Dia inteiro (auto)", cls: "text-amber-700" };
    return { label: "Por período (auto)", cls: "text-emerald-700" };
  };

  const addCity = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const geo = await calcDistanceFromOrigin({ city: form.name, state: form.state });
      await upsert.mutateAsync({
        name: form.name,
        state: form.state,
        lat: geo.lat,
        lng: geo.lng,
        distance_km: geo.distance_km,
        force_long_distance: null,
      });
      toast.success(`${form.name} adicionada (${geo.distance_km} km).`);
      setAddOpen(false);
      setForm({ name: "", state: "PR" });
    } catch {
      toast.error("Não foi possível calcular a distância.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Logística"
        description={`Equipamento sai de ${ORIGIN.city}-${ORIGIN.state}. Entrega e retirada no mesmo dia.`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportLogisticsPDF(
                  cities.map((c) => ({
                    name: c.name,
                    state: c.state,
                    distance_km: c.distance_km,
                    rule: ruleOf(c.force_long_distance, c.distance_km).label,
                  })),
                  [
                    ["Cidades atendidas", String(citiesServed)],
                    ["Quilometragem do mês", `${formatNumber(kmMonth)} km`],
                    ["Quilometragem do ano", `${formatNumber(kmYear)} km`],
                    ["Cidades cadastradas", String(cities.length)],
                  ],
                )
              }
            >
              <FileText className="h-4 w-4" /> Relatório PDF
            </Button>
            <Button variant="gold" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Adicionar cidade
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cidades atendidas" value={citiesServed} icon={MapPin} accent="navy" />
        <StatCard label="Quilometragem do mês" value={`${formatNumber(kmMonth)} km`} icon={Truck} accent="gold" hint="Ida e volta" />
        <StatCard label="Quilometragem do ano" value={`${formatNumber(kmYear)} km`} icon={Route} accent="emerald" hint={year} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Cidades e regras de disponibilidade</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Distância</th>
                  <th className="px-4 py-3">Regra aplicada</th>
                  <th className="px-4 py-3">Sobrescrever regra</th>
                  <th className="px-4 py-3 text-right">Rota</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => {
                  const rule = ruleOf(c.force_long_distance, c.distance_km);
                  const force = c.force_long_distance === null ? "auto" : c.force_long_distance ? "long" : "normal";
                  return (
                    <tr key={c.id} className="border-b">
                      <td className="px-4 py-3 font-medium">{c.name} - {c.state}</td>
                      <td className="px-4 py-3">{formatNumber(c.distance_km)} km</td>
                      <td className={`px-4 py-3 font-medium ${rule.cls}`}>{rule.label}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={force}
                          onValueChange={(v) =>
                            setForceLong.mutate({ id: c.id, value: v === "auto" ? null : v === "long" })
                          }
                        >
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automática</SelectItem>
                            <SelectItem value="normal">Por período</SelectItem>
                            <SelectItem value="long">Dia inteiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${ORIGIN.lat},${ORIGIN.lng}&destination=${encodeURIComponent(c.name + ", " + c.state + ", Brasil")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Mapa <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-gold" /> Regras de logística
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold text-emerald-700">Até {settings.mid_distance_km} km</p>
            <p className="text-muted-foreground">Reserva normal por período.</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold text-blue-700">{settings.mid_distance_km + 1} a {settings.long_distance_km} km</p>
            <p className="text-muted-foreground">Reserva normal por período.</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="font-semibold text-amber-700">Acima de {settings.long_distance_km} km</p>
            <p className="text-muted-foreground">Ocupa o dia inteiro — bloqueia manhã e tarde.</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar cidade</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cidade" className="sm:col-span-2">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Cascavel" />
            </Field>
            <Field label="UF">
              <Select value={form.state} onValueChange={(v) => setForm((f) => ({ ...f, state: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BR_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">A distância de {ORIGIN.city} será calculada automaticamente.</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="gold" onClick={addCity} disabled={saving || !form.name}>
              {saving ? "Calculando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
