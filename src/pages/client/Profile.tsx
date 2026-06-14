import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, PageHeader, Spinner } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/data";
import { SPECIALTIES } from "@/lib/constants";
import { maskPhone } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(3, "Informe seu nome"),
  crm: z.string().min(2, "Informe seu CRM"),
  specialty: z.string().min(1, "Selecione"),
  clinic: z.string().min(2, "Informe a clínica"),
  phone: z.string().min(14, "Telefone inválido"),
});
type FormData = z.infer<typeof schema>;

export default function ClientProfile() {
  const { profile, userId, refreshProfile } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name,
        crm: profile.crm,
        specialty: profile.specialty,
        clinic: profile.clinic,
        phone: profile.phone,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: FormData) => {
    if (!userId) return;
    try {
      await db.updateProfile(userId, data);
      await refreshProfile();
      toast.success("Perfil atualizado!");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Meu Perfil" description="Atualize seus dados cadastrais." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Nome completo" htmlFor="full_name" error={errors.full_name?.message} required>
              <Input id="full_name" {...register("full_name")} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CRM" htmlFor="crm" error={errors.crm?.message} required>
                <Input id="crm" {...register("crm")} />
              </Field>
              <Field label="Especialidade" error={errors.specialty?.message} required>
                <Controller
                  control={control}
                  name="specialty"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALTIES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Clínica" htmlFor="clinic" error={errors.clinic?.message} required>
                <Input id="clinic" {...register("clinic")} />
              </Field>
              <Field label="Telefone" htmlFor="phone" error={errors.phone?.message} required>
                <Input id="phone" {...register("phone", { onChange: (e) => setValue("phone", maskPhone(e.target.value)) })} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail" hint="Não pode ser alterado">
                <Input value={profile?.email ?? ""} disabled />
              </Field>
              <Field label="CPF" hint="Não pode ser alterado">
                <Input value={profile?.cpf ?? ""} disabled />
              </Field>
            </div>

            <Button type="submit" variant="gold" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="text-navy-900" /> : <><Save className="h-4 w-4" /> Salvar alterações</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
