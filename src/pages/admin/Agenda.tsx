import * as React from "react";
import { toast } from "sonner";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, PageHeader, PageLoader } from "@/components/shared/common";
import { ManageReservationDialog } from "@/components/admin/ManageReservationDialog";
import { useBlocks, useBlockMutations, useReservations } from "@/hooks/api";
import { STATUS_META, PERIODS } from "@/lib/constants";
import { formatDate, todayISO } from "@/lib/utils";
import type { Reservation, ReservationPeriod } from "@/types";

const periodTimes: Record<string, { start: string; end: string }> = {
  morning: { start: "07:00:00", end: "12:00:00" },
  afternoon: { start: "13:00:00", end: "18:00:00" },
  full: { start: "07:00:00", end: "18:00:00" },
};

const BLOCK_COLOR = "#64748b";

export default function AdminAgenda() {
  const { data: reservations = [], isLoading } = useReservations();
  const { data: blocks = [] } = useBlocks();
  const { add, remove } = useBlockMutations();
  const [selected, setSelected] = React.useState<Reservation | null>(null);
  const [open, setOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [form, setForm] = React.useState<{ date: string; period: ReservationPeriod; reason: string }>({
    date: todayISO(),
    period: "full",
    reason: "",
  });

  if (isLoading) return <PageLoader />;

  const resEvents = reservations
    .filter((r) => r.status !== "cancelled")
    .map((r) => {
      const t = periodTimes[r.effective_period];
      return {
        id: r.id,
        title: `${r.client_name} · ${r.city}`,
        start: `${r.date}T${t.start}`,
        end: `${r.date}T${t.end}`,
        backgroundColor: STATUS_META[r.status].calendar,
        borderColor: STATUS_META[r.status].calendar,
        extendedProps: { kind: "reservation", reservation: r },
      };
    });

  const blockEvents = blocks.map((b) => {
    const t = periodTimes[b.period];
    return {
      id: b.id,
      title: `🔒 Bloqueado${b.reason ? `: ${b.reason}` : ""}`,
      start: `${b.date}T${t.start}`,
      end: `${b.date}T${t.end}`,
      backgroundColor: BLOCK_COLOR,
      borderColor: BLOCK_COLOR,
      extendedProps: { kind: "block", blockId: b.id },
    };
  });

  const addBlock = async () => {
    if (!form.date) return;
    await add.mutateAsync(form);
    toast.success("Período bloqueado na agenda.");
    setBlockOpen(false);
    setForm({ date: todayISO(), period: "full", reason: "" });
  };

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Calendário de reservas e bloqueios do equipamento."
        action={
          <Button variant="gold" onClick={() => setBlockOpen(true)}>
            <CalendarOff className="h-4 w-4" /> Bloquear data
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-3 w-3 rounded" style={{ background: STATUS_META[s].calendar }} /> {STATUS_META[s].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-3 w-3 rounded" style={{ background: BLOCK_COLOR }} /> Bloqueado
        </span>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-5">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            firstDay={1}
            headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
            buttonText={{ today: "Hoje", month: "Mês", week: "Semana", day: "Dia" }}
            slotMinTime="06:00:00"
            slotMaxTime="19:00:00"
            allDaySlot={false}
            height="auto"
            events={[...resEvents, ...blockEvents]}
            eventClick={(info) => {
              const kind = info.event.extendedProps.kind;
              if (kind === "reservation") {
                setSelected(info.event.extendedProps.reservation as Reservation);
                setOpen(true);
              } else if (kind === "block") {
                if (confirm("Remover este bloqueio da agenda?")) {
                  remove.mutate(info.event.extendedProps.blockId as string);
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {blocks.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Bloqueios ativos</p>
            <div className="space-y-2">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>
                    <strong>{formatDate(b.date)}</strong> · {PERIODS[b.period].label}
                    {b.reason && <span className="text-muted-foreground"> — {b.reason}</span>}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(b.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ManageReservationDialog reservation={selected} open={open} onOpenChange={setOpen} />

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear data na agenda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data">
              <Input type="date" min={todayISO()} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </Field>
            <Field label="Período">
              <Select value={form.period} onValueChange={(v) => setForm((f) => ({ ...f, period: v as ReservationPeriod }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["full", "morning", "afternoon"] as ReservationPeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>{PERIODS[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Motivo (opcional)">
            <Input placeholder="Ex.: manutenção, feriado..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="gold" onClick={addBlock}>
              <Plus className="h-4 w-4" /> Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
