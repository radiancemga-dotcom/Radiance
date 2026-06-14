import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  CheckCircle2,
  Sun,
  Sunset,
  Sparkles,
  Zap,
  Ticket,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, Spinner } from "@/components/shared/common";
import { AvailabilityCalendar } from "@/components/shared/AvailabilityCalendar";
import { useAuth } from "@/providers/AuthProvider";
import { useAvailability, useCreateReservation, useEquipment, useSettings } from "@/hooks/api";
import { db } from "@/data";
import { BR_STATES, PERIODS } from "@/lib/constants";
import { calcDistanceFromOrigin, lookupCep } from "@/lib/geo";
import { applyLogistics, type LogisticsRule } from "@/lib/logistics";
import { couponDiscount, priceBreakdown } from "@/lib/pricing";
import { formatCurrency, formatNumber, maskCEP } from "@/lib/utils";
import type { Coupon, GeoResult, ReservationPeriod } from "@/types";

const schema = z.object({
  equipment_id: z.string().min(1, "Selecione o equipamento"),
  date: z.string().min(1, "Selecione a data"),
  period: z.enum(["morning", "afternoon", "full"]),
  clinic_name: z.string().min(2, "Informe a clínica"),
  cep: z.string().min(9, "CEP inválido"),
  address: z.string().min(3, "Informe o endereço"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().min(2, "UF"),
  procedures: z.string().min(3, "Descreva os procedimentos"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const periodOptions: { value: ReservationPeriod; icon: typeof Sun }[] = [
  { value: "morning", icon: Sun },
  { value: "afternoon", icon: Sunset },
  { value: "full", icon: Sparkles },
];

export default function NewReservation() {
  const { userId, profile } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const { data: equipment = [] } = useEquipment();
  const createReservation = useCreateReservation();

  const [geo, setGeo] = React.useState<GeoResult | null>(null);
  const [rule, setRule] = React.useState<LogisticsRule | null>(null);
  const [conflict, setConflict] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [cepLoading, setCepLoading] = React.useState(false);

  // cupom
  const [couponInput, setCouponInput] = React.useState("");
  const [coupon, setCoupon] = React.useState<Coupon | null>(null);
  const [couponChecking, setCouponChecking] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { equipment_id: "", period: "morning", clinic_name: profile?.clinic ?? "", notes: "" },
  });

  const period = watch("period");
  const date = watch("date");
  const equipmentId = watch("equipment_id");

  const activeEquipment = React.useMemo(() => equipment.filter((e) => e.active), [equipment]);
  const { data: availability = [] } = useAvailability(equipmentId || undefined);

  // seleciona o primeiro equipamento ativo por padrão
  React.useEffect(() => {
    if (!equipmentId && activeEquipment.length > 0) {
      setValue("equipment_id", activeEquipment[0].id);
    }
  }, [activeEquipment, equipmentId, setValue]);

  const dayAvail = React.useMemo(() => availability.find((a) => a.date === date), [availability, date]);
  const periodDisabled = (p: ReservationPeriod) => {
    if (!dayAvail) return false;
    if (p === "morning") return dayAvail.morning;
    if (p === "afternoon") return dayAvail.afternoon;
    return dayAvail.morning || dayAvail.afternoon; // integral
  };

  // recalcular exige nova verificação
  React.useEffect(() => {
    setGeo(null);
    setRule(null);
    setConflict(false);
  }, [watch("city"), watch("state"), watch("cep"), date, period, equipmentId]);

  const applyCouponCode = async () => {
    if (!couponInput.trim()) return;
    setCouponChecking(true);
    try {
      const c = await db.validateCoupon(couponInput);
      if (c) {
        setCoupon(c);
        toast.success(`Cupom ${c.code} aplicado!`);
      } else {
        setCoupon(null);
        toast.error("Cupom inválido ou expirado.");
      }
    } finally {
      setCouponChecking(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
  };

  const handleCepBlur = async () => {
    const cep = watch("cep");
    if (cep.replace(/\D/g, "").length !== 8) return;
    setCepLoading(true);
    const res = await lookupCep(cep);
    setCepLoading(false);
    if (res) {
      if (res.street) setValue("address", res.street);
      setValue("city", res.city);
      setValue("state", res.state);
    } else {
      toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
    }
  };

  const checkAvailability = async () => {
    const v = watch();
    if (!v.city || !v.state || !v.date || !settings) {
      toast.error("Preencha data, cidade e UF antes de verificar.");
      return;
    }
    setChecking(true);
    try {
      const g = await calcDistanceFromOrigin({ address: v.address, city: v.city, state: v.state, cep: v.cep });
      setGeo(g);
      const r = applyLogistics(g.distance_km, v.period, settings);
      setRule(r);
      const day = availability.find((a) => a.date === v.date);
      const wantMorning = r.isLongDistance || r.effectivePeriod === "full" || r.effectivePeriod === "morning";
      const wantAfternoon = r.isLongDistance || r.effectivePeriod === "full" || r.effectivePeriod === "afternoon";
      const conflicts = !!day && ((wantMorning && day.morning) || (wantAfternoon && day.afternoon));
      setConflict(conflicts);
      if (conflicts) {
        toast.error("Já existe reserva nessa data que conflita com este período.");
      } else {
        toast.success("Disponibilidade confirmada!");
      }
    } catch {
      toast.error("Não foi possível calcular a logística. Tente novamente.");
    } finally {
      setChecking(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!userId || !profile || !settings) return;
    if (!geo || !rule) {
      toast.error("Verifique a disponibilidade antes de confirmar.");
      return;
    }
    if (conflict) {
      toast.error("Não é possível reservar: há conflito de agenda nessa data.");
      return;
    }
    const breakdown = priceBreakdown(rule.effectivePeriod, settings);
    const discount = couponDiscount(breakdown.total, coupon);
    const finalPrice = Math.round((breakdown.total - discount) * 100) / 100;
    const eq = equipment.find((e) => e.id === data.equipment_id);
    try {
      const created = await createReservation.mutateAsync({
        user_id: userId,
        equipment_id: data.equipment_id,
        equipment_name: eq?.name ?? "",
        client_name: profile.full_name,
        client_email: profile.email,
        client_phone: profile.phone,
        date: data.date,
        period: data.period,
        effective_period: rule.effectivePeriod,
        clinic_name: data.clinic_name,
        address: data.address,
        city: data.city,
        state: data.state,
        cep: data.cep,
        procedures: data.procedures,
        notes: data.notes ?? "",
        distance_km: geo.distance_km,
        travel_minutes: geo.travel_minutes,
        is_long_distance: rule.isLongDistance,
        price: finalPrice,
        coupon_code: coupon?.code ?? "",
        discount_amount: discount,
        payment_status: "none",
        payment_link: "",
        status: "pending",
      });
      toast.success("Reserva criada! Acompanhe o status na sua área.");
      navigate(`/app/reserva/${created.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const breakdown = settings ? priceBreakdown(rule?.effectivePeriod ?? period, settings) : null;
  const couponValue = breakdown ? couponDiscount(breakdown.total, coupon) : 0;
  const finalTotal = breakdown ? breakdown.total - couponValue : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Nova Reserva</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reserve o Laser Duoglide em poucos passos.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Equipamento */}
          {activeEquipment.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-gold" /> Equipamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="equipment_id"
                  render={({ field }) => (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeEquipment.map((eq) => {
                        const selected = field.value === eq.id;
                        return (
                          <button
                            type="button"
                            key={eq.id}
                            onClick={() => field.onChange(eq.id)}
                            className={`rounded-xl border p-4 text-left transition ${
                              selected ? "border-gold bg-gold/10 ring-1 ring-gold" : "hover:border-gold/40"
                            }`}
                          >
                            <p className="font-semibold">{eq.name}</p>
                            <p className="text-xs text-muted-foreground">{eq.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Data e período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5 text-gold" /> Data e período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Data do atendimento" error={errors.date?.message} required>
                <AvailabilityCalendar
                  availability={availability}
                  value={date}
                  onSelect={(d) => {
                    setValue("date", d, { shouldValidate: true });
                    // se o período atual ficou indisponível nesse dia, ajusta
                    const a = availability.find((x) => x.date === d);
                    if (a) {
                      if (period === "morning" && a.morning) setValue("period", a.afternoon ? "morning" : "afternoon");
                      if (period === "afternoon" && a.afternoon) setValue("period", a.morning ? "afternoon" : "morning");
                      if (period === "full" && (a.morning || a.afternoon)) setValue("period", a.morning ? "afternoon" : "morning");
                    }
                  }}
                />
              </Field>

              <div>
                <p className="mb-2 text-sm font-medium">Período <span className="text-destructive">*</span></p>
                <Controller
                  control={control}
                  name="period"
                  render={({ field }) => (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {periodOptions.map((opt) => {
                        const meta = PERIODS[opt.value];
                        const selected = field.value === opt.value;
                        const isDisabled = periodDisabled(opt.value);
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            disabled={isDisabled}
                            onClick={() => field.onChange(opt.value)}
                            className={`rounded-xl border p-4 text-left transition ${
                              isDisabled
                                ? "cursor-not-allowed border-dashed opacity-50"
                                : selected
                                  ? "border-gold bg-gold/10 ring-1 ring-gold"
                                  : "hover:border-gold/40"
                            }`}
                          >
                            <opt.icon className={`h-5 w-5 ${selected && !isDisabled ? "text-gold" : "text-muted-foreground"}`} />
                            <p className="mt-2 font-semibold">{meta.label}</p>
                            <p className="text-xs text-muted-foreground">{isDisabled ? "Indisponível neste dia" : meta.hours}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Local de atendimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-gold" /> Local de atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Clínica / Consultório" htmlFor="clinic_name" error={errors.clinic_name?.message} required>
                <Input id="clinic_name" placeholder="Nome do local" {...register("clinic_name")} />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="CEP" htmlFor="cep" error={errors.cep?.message} required hint={cepLoading ? "Buscando..." : "Autocompleta o endereço"}>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    {...register("cep", { onChange: (e) => setValue("cep", maskCEP(e.target.value)) })}
                    onBlur={handleCepBlur}
                  />
                </Field>
                <Field label="Cidade" htmlFor="city" error={errors.city?.message} required className="sm:col-span-2">
                  <Input id="city" placeholder="Cidade" {...register("city")} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Field label="Endereço" htmlFor="address" error={errors.address?.message} required className="sm:col-span-3">
                  <Input id="address" placeholder="Rua, número, bairro" {...register("address")} />
                </Field>
                <Field label="UF" error={errors.state?.message} required>
                  <Controller
                    control={control}
                    name="state"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {BR_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>

              <Button type="button" variant="outline" onClick={checkAvailability} disabled={checking} className="w-full">
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {checking ? "Calculando logística..." : "Verificar disponibilidade e logística"}
              </Button>
            </CardContent>
          </Card>

          {/* Procedimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Procedimentos e observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Procedimentos que serão realizados" htmlFor="procedures" error={errors.procedures?.message} required>
                <Textarea id="procedures" rows={3} placeholder="Ex.: depilação a laser, rejuvenescimento..." {...register("procedures")} />
              </Field>
              <Field label="Observações" htmlFor="notes">
                <Textarea id="notes" rows={2} placeholder="Informações adicionais (opcional)" {...register("notes")} />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-gold" /> Resumo da reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <Row label="Período">{PERIODS[rule?.effectivePeriod ?? period].label}</Row>
                <Row label="Data">{date ? new Date(date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</Row>

                {geo && (
                  <>
                    <Row label="Distância de Maringá">{formatNumber(geo.distance_km)} km</Row>
                    <Row label="Tempo estimado">
                      {geo.travel_minutes ? `${Math.floor(geo.travel_minutes / 60)}h ${geo.travel_minutes % 60}min` : "—"}
                    </Row>
                  </>
                )}

                {/* Cupom de desconto */}
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                    <Ticket className="h-4 w-4 text-gold" /> Cupom de desconto
                  </p>
                  {coupon ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                      <span className="font-medium text-emerald-700">
                        {coupon.code} ({coupon.discount_type === "percent" ? `${coupon.value}%` : formatCurrency(coupon.value)})
                      </span>
                      <button type="button" onClick={removeCoupon} className="text-emerald-700 hover:text-emerald-900">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código do cupom"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      />
                      <Button type="button" variant="outline" onClick={applyCouponCode} disabled={couponChecking || !couponInput.trim()}>
                        {couponChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                  )}
                </div>

                {breakdown && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    {breakdown.discount > 0 && (
                      <>
                        <Row label="Valor bruto">{formatCurrency(breakdown.gross)}</Row>
                        <Row label={`Desconto integral (${breakdown.discountPct}%)`}>
                          <span className="text-emerald-600">- {formatCurrency(breakdown.discount)}</span>
                        </Row>
                      </>
                    )}
                    {couponValue > 0 && (
                      <Row label={`Cupom ${coupon?.code ?? ""}`}>
                        <span className="text-emerald-600">- {formatCurrency(couponValue)}</span>
                      </Row>
                    )}
                    <div className="mt-1 flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-display text-xl font-bold text-primary">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                )}

                {rule && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
                      conflict
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : rule.isLongDistance
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {conflict ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>
                      {conflict
                        ? "Conflito de agenda nessa data. Escolha outro dia."
                        : rule.message}
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={createReservation.isPending || !geo || conflict}
                >
                  {createReservation.isPending ? <Spinner className="text-navy-900" /> : "Confirmar reserva"}
                </Button>
                {!geo && (
                  <p className="text-center text-xs text-muted-foreground">
                    Verifique a disponibilidade para liberar a confirmação.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
