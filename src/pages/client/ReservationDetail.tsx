import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  CalendarClock,
  ExternalLink,
  FileDown,
  MapPin,
  Navigation,
  Stethoscope,
  XCircle,
  History,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { PageLoader, StatusBadge } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { useHistory, useReservation, useSettings, useUpdateReservation } from "@/hooks/api";
import { exportReservationPDF } from "@/lib/export";
import { isPaymentsEnabled, PAYMENT_STATUS_LABEL } from "@/lib/payments";
import { RescheduleDialog } from "@/components/client/RescheduleDialog";
import { ReviewCard } from "@/components/client/ReviewCard";
import { ORIGIN, PERIODS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";

function mapUrl(address: string, city: string, state: string) {
  const dest = encodeURIComponent(`${address}, ${city} - ${state}, Brasil`);
  return `https://www.google.com/maps/dir/?api=1&origin=${ORIGIN.lat},${ORIGIN.lng}&destination=${dest}`;
}

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, userId } = useAuth();
  const { data: r, isLoading } = useReservation(id);
  const { data: history = [] } = useHistory(id);
  const { data: settings } = useSettings();
  const update = useUpdateReservation();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  if (isLoading) return <PageLoader />;
  if (!r) return <p className="text-muted-foreground">Reserva não encontrada.</p>;

  const canCancel = r.status === "pending" || r.status === "confirmed";
  const canReschedule = canCancel;

  const cancel = async () => {
    await update.mutateAsync({
      id: r.id,
      patch: { status: "cancelled" },
      actor: { id: userId ?? "", name: profile?.full_name ?? "Cliente" },
    });
    toast.success("Reserva cancelada.");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reserva em {r.city}</h1>
          <p className="text-sm text-muted-foreground">Criada em {formatDateTime(r.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={r.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportReservationPDF(r, {
                name: settings?.company_name,
                phone: settings?.company_phone,
                email: settings?.company_email,
              })
            }
          >
            <FileDown className="h-4 w-4" /> Comprovante
          </Button>
          {canReschedule && (
            <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
              <CalendarClock className="h-4 w-4" /> Reagendar
            </Button>
          )}
          {canCancel && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <XCircle className="h-4 w-4" /> Cancelar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar reserva?</DialogTitle>
                  <DialogDescription>
                    Esta ação não pode ser desfeita. A reserva em {r.city} para {formatDate(r.date)} será cancelada.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Voltar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive" onClick={cancel}>Confirmar cancelamento</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes do agendamento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info icon={Zap} label="Equipamento" value={r.equipment_name || "—"} />
              <Info icon={CalendarDays} label="Data" value={formatDate(r.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} />
              <Info icon={Clock} label="Período" value={`${PERIODS[r.effective_period].label} (${PERIODS[r.effective_period].hours})`} />
              <Info icon={Building2} label="Clínica" value={r.clinic_name} />
              <Info icon={Stethoscope} label="Procedimentos" value={r.procedures} />
              <Info icon={MapPin} label="Endereço" value={`${r.address}, ${r.city} - ${r.state}, ${r.cep}`} className="sm:col-span-2" />
              {r.notes && <Info icon={History} label="Observações" value={r.notes} className="sm:col-span-2" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-gold" /> Histórico de alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem alterações registradas.</p>
              ) : (
                <ol className="relative space-y-4 border-l pl-5">
                  {history.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[1.42rem] top-1 h-2.5 w-2.5 rounded-full bg-gold" />
                      <p className="text-sm">
                        <strong>{h.field}</strong>: {h.old_value || "—"} → {h.new_value || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {h.changed_by_name} · {formatDateTime(h.created_at)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-primary">{formatCurrency(r.price)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{PERIODS[r.effective_period].label}</p>
              {r.discount_amount > 0 && (
                <p className="mt-1 text-xs text-emerald-600">
                  Cupom {r.coupon_code}: -{formatCurrency(r.discount_amount)}
                </p>
              )}
              {isPaymentsEnabled && r.payment_status !== "none" && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-muted-foreground">Pagamento: <strong className={r.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"}>{PAYMENT_STATUS_LABEL[r.payment_status]}</strong></p>
                  {r.payment_link && r.payment_status === "pending" && (
                    <Button asChild variant="gold" size="sm" className="mt-2 w-full">
                      <a href={r.payment_link} target="_blank" rel="noopener noreferrer">Pagar agora</a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-5 w-5 text-gold" /> Logística
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distância de Maringá</span>
                <span className="font-medium">{formatNumber(r.distance_km)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo estimado</span>
                <span className="font-medium">
                  {r.travel_minutes ? `${Math.floor(r.travel_minutes / 60)}h ${r.travel_minutes % 60}min` : "—"}
                </span>
              </div>
              {r.is_long_distance && (
                <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                  Reserva de longa distância — ocupa o dia inteiro.
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={mapUrl(r.address, r.city, r.state)} target="_blank" rel="noopener noreferrer">
                  Ver rota no mapa <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <ReviewCard reservation={r} />
        </div>
      </div>

      {canReschedule && (
        <RescheduleDialog reservation={r} open={rescheduleOpen} onOpenChange={setRescheduleOpen} />
      )}
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-medium capitalize-first">{value}</p>
    </div>
  );
}
