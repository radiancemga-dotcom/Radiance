import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AvailabilityCalendar } from "@/components/shared/AvailabilityCalendar";
import { Spinner } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { useAvailability, useSettings, useUpdateReservation } from "@/hooks/api";
import { db } from "@/data";
import { PERIODS } from "@/lib/constants";
import { applyLogistics, hasConflict } from "@/lib/logistics";
import { calcPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { Reservation, ReservationPeriod } from "@/types";

export function RescheduleDialog({
  reservation,
  open,
  onOpenChange,
}: {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { userId, profile } = useAuth();
  const { data: settings } = useSettings();
  const { data: availability = [] } = useAvailability(reservation.equipment_id);
  const update = useUpdateReservation();

  const [date, setDate] = React.useState(reservation.date);
  const [period, setPeriod] = React.useState<ReservationPeriod>(
    reservation.is_long_distance ? "full" : reservation.effective_period,
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDate(reservation.date);
      setPeriod(reservation.is_long_distance ? "full" : reservation.effective_period);
    }
  }, [open, reservation]);

  if (!settings) return null;

  const effectivePeriod: ReservationPeriod = reservation.is_long_distance ? "full" : period;
  const newPrice = calcPrice(effectivePeriod, settings);
  const changed = date !== reservation.date || effectivePeriod !== reservation.effective_period;

  const confirm = async () => {
    if (!changed) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }
    setSaving(true);
    try {
      const rule = applyLogistics(reservation.distance_km, period, settings, null);
      const others = await db.reservationsOnDate(date, reservation.id, reservation.equipment_id);
      if (hasConflict(rule, others)) {
        toast.error("Esse dia/período já está ocupado. Escolha outro.");
        setSaving(false);
        return;
      }
      await update.mutateAsync({
        id: reservation.id,
        patch: { date, period, effective_period: rule.effectivePeriod, price: newPrice },
        actor: { id: userId ?? "", name: profile?.full_name ?? "Cliente" },
      });
      toast.success("Reserva reagendada!");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reagendar reserva</DialogTitle>
          <DialogDescription>
            Escolha nova data e período. O endereço e a distância permanecem os mesmos.
          </DialogDescription>
        </DialogHeader>

        <AvailabilityCalendar availability={availability} value={date} onSelect={setDate} />

        {!reservation.is_long_distance ? (
          <div className="grid grid-cols-3 gap-2">
            {(["morning", "afternoon", "full"] as ReservationPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  period === p ? "border-gold bg-gold/10 ring-1 ring-gold" : "hover:border-gold/40"
                }`}
              >
                {PERIODS[p].label}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
            Reserva de longa distância — ocupa o dia inteiro.
          </p>
        )}

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Novo valor</span>
          <span className="font-display text-lg font-bold text-primary">{formatCurrency(newPrice)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="gold" onClick={confirm} disabled={saving || !changed}>
            {saving ? <Spinner className="text-navy-900" /> : "Confirmar reagendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
