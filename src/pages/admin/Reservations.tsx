import * as React from "react";
import { FileSpreadsheet, FileText, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader, PageLoader, StatusBadge } from "@/components/shared/common";
import { ManageReservationDialog } from "@/components/admin/ManageReservationDialog";
import { useReservations } from "@/hooks/api";
import { PERIODS, STATUS_META } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportReservationsPDF, exportToExcel } from "@/lib/export";
import type { Reservation } from "@/types";

export default function AdminReservations() {
  const { data: reservations = [], isLoading } = useReservations();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [selected, setSelected] = React.useState<Reservation | null>(null);
  const [open, setOpen] = React.useState(false);

  if (isLoading) return <PageLoader />;

  const filtered = reservations.filter((r) => {
    const matchStatus = status === "all" || r.status === status;
    const matchQ =
      !q ||
      r.client_name.toLowerCase().includes(q.toLowerCase()) ||
      r.city.toLowerCase().includes(q.toLowerCase()) ||
      r.clinic_name.toLowerCase().includes(q.toLowerCase());
    return matchStatus && matchQ;
  });

  const openManage = (r: Reservation) => {
    setSelected(r);
    setOpen(true);
  };

  const exportExcel = () => {
    exportToExcel("radiance_reservas", {
      Reservas: filtered.map((r) => ({
        Data: r.date,
        Cliente: r.client_name,
        Clinica: r.clinic_name,
        Cidade: `${r.city} - ${r.state}`,
        Periodo: PERIODS[r.effective_period].label,
        Distancia_km: r.distance_km,
        Valor: r.price,
        Status: STATUS_META[r.status].label,
      })),
    });
  };

  const exportPDF = () => {
    exportReservationsPDF(
      filtered.map((r) => ({
        date: r.date,
        client: r.client_name,
        city: `${r.city} - ${r.state}`,
        period: PERIODS[r.effective_period].label,
        price: r.price,
        status: STATUS_META[r.status].label,
      })),
      status === "all" ? "Todas as reservas" : `Status: ${STATUS_META[status as keyof typeof STATUS_META].label}`,
    );
  };

  return (
    <div>
      <PageHeader
        title="Reservas"
        description="Aprove, altere e acompanhe todas as reservas."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportExcel} disabled={filtered.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={exportPDF} disabled={filtered.length === 0}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por cliente, clínica ou cidade..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="Nenhuma reserva encontrada" description="Ajuste os filtros de busca." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b transition hover:bg-accent/50"
                    onClick={() => openManage(r)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.client_name}</p>
                      <p className="text-xs text-muted-foreground">{r.clinic_name}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">
                      {PERIODS[r.effective_period].label}
                      {r.is_long_distance && <span className="ml-1 text-xs text-amber-600">●</span>}
                    </td>
                    <td className="px-4 py-3">{r.city} - {r.state}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(r.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ManageReservationDialog reservation={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
