import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, todayISO } from "@/lib/utils";
import type { DayAvailability } from "@/types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function AvailabilityCalendar({
  availability,
  value,
  onSelect,
}: {
  availability: DayAvailability[];
  value?: string;
  onSelect: (date: string) => void;
}) {
  const today = todayISO();
  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [view, setView] = React.useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const map = React.useMemo(() => {
    const m = new Map<string, DayAvailability>();
    availability.forEach((a) => m.set(a.date, a));
    return m;
  }, [availability]);

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const move = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className="rounded-md p-1.5 hover:bg-accent" aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-sm font-semibold">
          {MONTHS[view.month]} {view.year}
        </span>
        <button type="button" onClick={() => move(1)} className="rounded-md p-1.5 hover:bg-accent" aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 font-medium">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const date = iso(view.year, view.month, day);
          const avail = map.get(date);
          const full = !!avail?.morning && !!avail?.afternoon;
          const partial = !!avail && !full && (avail.morning || avail.afternoon);
          const isPast = date < today;
          const disabled = isPast || full;
          const selected = value === date;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              title={
                isPast ? "Data passada" : full ? "Dia indisponível" : partial ? "Parcialmente reservado" : "Disponível"
              }
              className={cn(
                "relative flex h-9 items-center justify-center rounded-md text-sm transition",
                selected && "gold-gradient font-semibold text-navy-900",
                !selected && !disabled && "hover:bg-accent",
                disabled && "cursor-not-allowed text-muted-foreground/40 line-through",
              )}
            >
              {day}
              {!selected && partial && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-amber-500" />}
              {!selected && full && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-rose-500" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 border-t pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponível</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Parcial (1 período)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> Indisponível</span>
      </div>
    </div>
  );
}
