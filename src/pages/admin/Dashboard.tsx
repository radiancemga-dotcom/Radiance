import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  DollarSign,
  Users,
  TrendingUp,
  Truck,
  Activity,
  ArrowRight,
  Star,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageLoader, StatCard, StatusBadge } from "@/components/shared/common";
import { useClients, useReservations, useFinancial, useReviews } from "@/hooks/api";
import { STATUS_META, PERIODS } from "@/lib/constants";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: reservations = [], isLoading } = useReservations();
  const { data: clients = [] } = useClients();
  const { data: financial = [] } = useFinancial();
  const { data: reviews = [] } = useReviews();
  const [month, setMonth] = useState(todayISO().slice(0, 7));

  if (isLoading) return <PageLoader />;

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const today = todayISO();
  const monthRes = reservations.filter((r) => r.date.slice(0, 7) === month && r.status !== "cancelled");
  const forecast = financial.filter((f) => f.month === month).reduce((s, f) => s + f.amount, 0);
  const received = financial.filter((f) => f.status === "received").reduce((s, f) => s + f.amount, 0);
  const activeClients = clients.filter((c) => !c.blocked).length;

  const upcoming = reservations
    .filter((r) => r.date >= today && r.status !== "cancelled" && r.status !== "completed")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  // ocupação do mês (dias com reserva / dias úteis aproximados 22)
  const busyDays = new Set(monthRes.map((r) => r.date)).size;
  const occupancy = Math.min(100, Math.round((busyDays / 22) * 100));

  // gráfico: reservas por mês (últimos 6)
  const monthly = lastMonths(6).map((m) => ({
    month: m.label,
    reservas: reservations.filter((r) => r.date.slice(0, 7) === m.key && r.status !== "cancelled").length,
    receita: financial.filter((f) => f.month === m.key).reduce((s, f) => s + f.amount, 0),
  }));

  // gráfico: distribuição por status
  const statusData = (Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((s) => ({
    name: STATUS_META[s].label,
    value: reservations.filter((r) => r.status === s).length,
    color: STATUS_META[s].calendar,
  })).filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação."
        action={
          <div className="flex items-center gap-2">
            <label htmlFor="month" className="text-sm text-muted-foreground">Mês:</label>
            <input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || todayISO().slice(0, 7))}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Reservas do mês" value={monthRes.length} icon={CalendarDays} accent="navy" />
        <StatCard label="Receita prevista (mês)" value={formatCurrency(forecast)} icon={TrendingUp} accent="gold" />
        <StatCard label="Receita realizada" value={formatCurrency(received)} icon={DollarSign} accent="emerald" />
        <StatCard label="Taxa de ocupação" value={`${occupancy}%`} icon={Activity} accent="violet" hint="Mês corrente" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes ativos" value={activeClients} icon={Users} accent="navy" />
        <StatCard label="Clientes cadastrados" value={clients.length} icon={Users} accent="gold" />
        <StatCard label="Próximas entregas" value={upcoming.length} icon={Truck} accent="emerald" />
        <StatCard label="Total de reservas" value={reservations.length} icon={CalendarDays} accent="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Reservas e receita (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number, name) => (name === "receita" ? formatCurrency(v) : v)}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
                />
                <Bar dataKey="reservas" fill="#243b66" radius={[6, 6, 0, 0]} name="Reservas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas por status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap gap-3">
              {statusData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-5 w-5 text-gold" /> Satisfação dos clientes
          </CardTitle>
          {reviews.length > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold">
              {avgRating.toFixed(1)} <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-normal text-muted-foreground">({reviews.length})</span>
            </span>
          )}
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma avaliação ainda.</p>
          ) : (
            <div className="divide-y">
              {reviews.slice(0, 5).map((rv) => (
                <div key={rv.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{rv.client_name} · {rv.city}</p>
                    {rv.comment && <p className="text-sm text-muted-foreground">"{rv.comment}"</p>}
                  </div>
                  <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold">
                    {rv.rating} <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Próximas reservas</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/reservas">Ver todas <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma reserva futura.</p>
          ) : (
            <div className="divide-y">
              {upcoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-col items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                      <span className="text-[10px]">{formatDate(r.date, { month: "short" })}</span>
                      <span className="font-display font-bold leading-none">{r.date.slice(8, 10)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.city} - {r.state} · {PERIODS[r.effective_period].label}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      key: m.toISOString().slice(0, 7),
      label: m.toLocaleDateString("pt-BR", { month: "short" }),
    });
  }
  return out;
}
