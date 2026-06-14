import * as React from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ListChecks, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, PageLoader, StatusBadge } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { useReservations } from "@/hooks/api";
import { PERIODS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReservationStatus } from "@/types";

const filters: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "completed", label: "Concluídas" },
  { value: "cancelled", label: "Canceladas" },
];

export default function MyReservations() {
  const { userId } = useAuth();
  const { data: reservations = [], isLoading } = useReservations(userId ?? undefined);
  const [filter, setFilter] = React.useState("all");

  if (isLoading) return <PageLoader />;

  const list = reservations.filter((r) => (filter === "all" ? true : r.status === (filter as ReservationStatus)));

  return (
    <div>
      <PageHeader
        title="Minhas Reservas"
        description="Histórico completo das suas locações."
        action={
          <Button asChild variant="gold">
            <Link to="/app/nova-reserva">
              <CalendarPlus className="h-4 w-4" /> Nova Reserva
            </Link>
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList className="flex-wrap">
          {filters.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nenhuma reserva encontrada"
          description="Não há reservas com este filtro."
        />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Link
              key={r.id}
              to={`/app/reserva/${r.id}`}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition hover:border-gold/50 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                  <span className="text-xs">{formatDate(r.date, { month: "short" })}</span>
                  <span className="font-display text-lg font-bold leading-none">{r.date.slice(8, 10)}</span>
                </div>
                <div>
                  <p className="font-medium">{r.clinic_name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {r.city} - {r.state}
                    {r.is_long_distance && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">Longa distância</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{PERIODS[r.effective_period].label} · {PERIODS[r.effective_period].hours}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                <StatusBadge status={r.status} />
                <span className="font-display font-semibold">{formatCurrency(r.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
