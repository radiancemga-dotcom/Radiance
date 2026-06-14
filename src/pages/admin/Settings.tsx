import * as React from "react";
import { toast } from "sonner";
import { Building2, Clock, DollarSign, Save, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, PageHeader, PageLoader, Spinner } from "@/components/shared/common";
import { useSettings, useUpdateSettings } from "@/hooks/api";
import { calcPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { Settings } from "@/types";

export default function AdminSettings() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = React.useState<Settings | null>(null);

  React.useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (isLoading || !form) return <PageLoader />;

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const num = (v: string) => Number(v.replace(",", ".")) || 0;

  const save = async () => {
    await update.mutateAsync(form);
    toast.success("Configurações salvas!");
  };

  const fullPrice = calcPrice("full", form);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Configurações"
        description="Ajuste valores, horários, dados da empresa e regras de logística."
        action={
          <Button variant="gold" onClick={save} disabled={update.isPending}>
            {update.isPending ? <Spinner className="text-navy-900" /> : <><Save className="h-4 w-4" /> Salvar tudo</>}
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-gold" /> Valores de locação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Meio período (R$)" hint="Manhã ou tarde">
              <Input type="number" value={form.price_half_period} onChange={(e) => set("price_half_period", num(e.target.value))} />
            </Field>
            <Field label="Desconto integral (%)" hint="Sobre 2 meios períodos">
              <Input type="number" value={form.full_day_discount_pct} onChange={(e) => set("full_day_discount_pct", num(e.target.value))} />
            </Field>
            <Field label="Valor integral calculado">
              <Input value={formatCurrency(fullPrice)} disabled />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-gold" /> Horários dos períodos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Manhã — início">
              <Input type="time" value={form.morning_start} onChange={(e) => set("morning_start", e.target.value)} />
            </Field>
            <Field label="Manhã — fim">
              <Input type="time" value={form.morning_end} onChange={(e) => set("morning_end", e.target.value)} />
            </Field>
            <Field label="Tarde — início">
              <Input type="time" value={form.afternoon_start} onChange={(e) => set("afternoon_start", e.target.value)} />
            </Field>
            <Field label="Tarde — fim">
              <Input type="time" value={form.afternoon_end} onChange={(e) => set("afternoon_end", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-gold" /> Regras de logística
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Distância média (km)" hint="Até este valor: reserva por período (tier próximo)">
              <Input type="number" value={form.mid_distance_km} onChange={(e) => set("mid_distance_km", num(e.target.value))} />
            </Field>
            <Field label="Distância de longa (km)" hint="Acima deste valor: ocupa o dia inteiro">
              <Input type="number" value={form.long_distance_km} onChange={(e) => set("long_distance_km", num(e.target.value))} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-gold" /> Dados da empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa">
              <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
            </Field>
            <Field label="E-mail de contato">
              <Input value={form.company_email} onChange={(e) => set("company_email", e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.company_phone} onChange={(e) => set("company_phone", e.target.value)} />
            </Field>
            <Field label="WhatsApp" hint="Apenas números, com DDI. Ex.: 5544999999999">
              <Input value={form.company_whatsapp} onChange={(e) => set("company_whatsapp", e.target.value)} />
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
