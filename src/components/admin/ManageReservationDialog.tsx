import * as React from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, StatusBadge } from "@/components/shared/common";
import { useHistory, useUpdateReservation } from "@/hooks/api";
import { useAuth } from "@/providers/AuthProvider";
import { PERIODS, STATUS_META } from "@/lib/constants";
import { createCharge, isPaymentsEnabled, PAYMENT_STATUS_LABEL } from "@/lib/payments";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Reservation, ReservationPeriod, ReservationStatus } from "@/types";

const statusOrder: ReservationStatus[] = ["pending", "confirmed", "in_transit", "completed", "cancelled"];

export function ManageReservationDialog({
  reservation,
  open,
  onOpenChange,
}: {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { userId, profile } = useAuth();
  const update = useUpdateReservation();
  const qc = useQueryClient();
  const { data: history = [] } = useHistory(reservation?.id);
  const [charging, setCharging] = React.useState(false);

  const [status, setStatus] = React.useState<ReservationStatus>("pending");
  const [date, setDate] = React.useState("");
  const [period, setPeriod] = React.useState<ReservationPeriod>("morning");
  const [address, setAddress] = React.useState("");

  React.useEffect(() => {
    if (reservation) {
      setStatus(reservation.status);
      setDate(reservation.date);
      setPeriod(reservation.effective_period);
      setAddress(reservation.address);
    }
  }, [reservation]);

  if (!reservation) return null;

  const actor = { id: userId ?? "admin", name: profile?.full_name ?? "Administração" };

  const save = async () => {
    const patch: Partial<Reservation> = {};
    if (status !== reservation.status) patch.status = status;
    if (date !== reservation.date) patch.date = date;
    if (period !== reservation.effective_period) {
      patch.period = period;
      patch.effective_period = reservation.is_long_distance ? "full" : period;
    }
    if (address !== reservation.address) patch.address = address;
    if (Object.keys(patch).length === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }
    await update.mutateAsync({ id: reservation.id, patch, actor });
    toast.success("Reserva atualizada!");
    onOpenChange(false);
  };

  const quick = async (s: ReservationStatus) => {
    await update.mutateAsync({ id: reservation.id, patch: { status: s }, actor });
    toast.success(`Reserva ${STATUS_META[s].label.toLowerCase()}.`);
    setStatus(s);
  };

  const generateCharge = async () => {
    setCharging(true);
    try {
      const link = await createCharge(reservation.id);
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["reservation", reservation.id] });
      toast.success("Cobrança gerada no Asaas!");
      if (link) window.open(link, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCharging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Reserva — {reservation.client_name}
            <StatusBadge status={reservation.status} />
          </DialogTitle>
          <DialogDescription>
            {reservation.city} - {reservation.state} · {formatCurrency(reservation.price)} ·{" "}
            {reservation.distance_km} km de Maringá
          </DialogDescription>
        </DialogHeader>

        {/* Ações rápidas */}
        <div className="flex flex-wrap gap-2">
          {reservation.status === "pending" && (
            <>
              <Button size="sm" onClick={() => quick("confirmed")}>Aprovar</Button>
              <Button size="sm" variant="destructive" onClick={() => quick("cancelled")}>Rejeitar</Button>
            </>
          )}
          {reservation.status === "confirmed" && (
            <Button size="sm" onClick={() => quick("in_transit")}>Marcar em transporte</Button>
          )}
          {reservation.status === "in_transit" && (
            <Button size="sm" onClick={() => quick("completed")}>Marcar concluída</Button>
          )}
          {reservation.status !== "cancelled" && reservation.status !== "completed" && (
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => quick("cancelled")}>
              Cancelar
            </Button>
          )}
        </div>

        {/* Edição detalhada */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v as ReservationStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOrder.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Período">
            <Select value={period} onValueChange={(v) => setPeriod(v as ReservationPeriod)} disabled={reservation.is_long_distance}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["morning", "afternoon", "full"] as ReservationPeriod[]).map((p) => (
                  <SelectItem key={p} value={p}>{PERIODS[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Endereço">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
        </div>

        {isPaymentsEnabled && (
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-gold" /> Pagamento
              </span>
              <span className="text-sm text-muted-foreground">{PAYMENT_STATUS_LABEL[reservation.payment_status]}</span>
            </div>
            <div className="mt-2 flex gap-2">
              {reservation.payment_status === "none" && (
                <Button size="sm" variant="outline" onClick={generateCharge} disabled={charging}>
                  {charging ? "Gerando..." : "Gerar cobrança (Asaas)"}
                </Button>
              )}
              {reservation.payment_link && (
                <Button asChild size="sm" variant="ghost">
                  <a href={reservation.payment_link} target="_blank" rel="noopener noreferrer">
                    Abrir link <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1 text-sm font-medium">Procedimentos</p>
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{reservation.procedures}</p>
        </div>

        {history.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Histórico</p>
            <div className="max-h-32 space-y-1.5 overflow-y-auto text-xs text-muted-foreground">
              {history.map((h) => (
                <p key={h.id}>
                  <strong>{h.field}</strong>: {h.old_value || "—"} → {h.new_value || "—"} ·{" "}
                  {h.changed_by_name} · {formatDateTime(h.created_at)}
                </p>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="gold" onClick={save} disabled={update.isPending}>Salvar alterações</Button>
        </DialogFooter>
        <p className="text-center text-[11px] text-muted-foreground">Reserva criada em {formatDate(reservation.created_at)}</p>
      </DialogContent>
    </Dialog>
  );
}
