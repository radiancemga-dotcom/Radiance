import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  CalendarPlus,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader, PageLoader, StatCard, StatusBadge } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { useReservations } from "@/hooks/api";
import { PERIODS } from "@/lib/constants";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";

export default function ClientDashboard() {
  const { userId, profile } = useAuth();
  const { data: reservations = [], isLoading } = useReservations(userId ?? undefined);

  if (isLoading) return <PageLoader />;

  const today = todayISO();
  const active = reservations.filter((r) => r.status !== "cancelled");
  const upcoming = active
    .filter((r) => r.date >= today && r.status !== "completed")
    .sort((a, b) => a.date.localeCompare(b.date));
  const completed = reservations.filter((r) => r.status === "completed");
  const pending = reservations.filter((r) => r.status === "pending");

  return (
    <div>
      <PageHeader
        title={`Olá, ${profile?.full_name?.split(" ")[0] ?? "cliente"}!`}
        description="Acompanhe suas reservas do Laser Duoglide."
        action={
          <Button asChild variant="gold">
            <Link to="/app/nova-reserva">
              <CalendarPlus className="h-4 w-4" /> Nova Reserva
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Próximas reservas" value={upcoming.length} icon={CalendarClock} accent="navy" />
        <StatCard label="Pendentes" value={pending.length} icon={Clock3} accent="gold" />
        <StatCard label="Concluídas" value={completed.length} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Total no histórico" value={reservations.length} icon={History} accent="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Próximas reservas</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/minhas-reservas">Ver todas <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nenhuma reserva agendada"
                description="Crie sua primeira reserva para começar."
                action={
                  <Button asChild variant="gold">
                    <Link to="/app/nova-reserva">Reservar agora</Link>
                  </Button>
                }
              />
            ) : (
              upcoming.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  to={`/app/reserva/${r.id}`}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition hover:border-gold/50 hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                      <span className="text-xs">{formatDate(r.date, { month: "short" })}</span>
                      <span className="font-display text-lg font-bold leading-none">{r.date.slice(8, 10)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{PERIODS[r.effective_period].label} · {PERIODS[r.effective_period].hours}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {r.city} - {r.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(r.price)}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {completed.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sem reservas concluídas ainda.</p>
            ) : (
              completed.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{r.city}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(r.price)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
