import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { GoogleButton } from "./GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, Spinner } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { SPECIALTIES } from "@/lib/constants";
import { usePageTitle } from "@/hooks/usePageTitle";
import { isValidCPF, maskCPF, maskPhone } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(3, "Informe seu nome completo"),
  cpf: z.string().refine((v) => isValidCPF(v), "CPF inválido"),
  crm: z.string().min(2, "Informe seu CRM"),
  specialty: z.string().min(1, "Selecione a especialidade"),
  clinic: z.string().min(2, "Informe a clínica"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(14, "Telefone inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  usePageTitle("Criar conta");
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = React.useState<null | string>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { specialty: "" } });

  const onSubmit = async (data: FormData) => {
    try {
      const { needsConfirmation } = await signUp(data);
      if (needsConfirmation) {
        setDone(data.email);
      } else {
        toast.success("Cadastro concluído! Bem-vindo(a).");
        navigate("/app", { replace: true });
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Confirme seu e-mail" subtitle="Falta só um passo para ativar sua conta.">
        <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong className="text-foreground">{done}</strong>. Abra seu
          e-mail e clique no link para ativar sua conta. Depois, faça login normalmente.
        </div>
        <Button asChild className="mt-5 w-full" variant="gold">
          <Link to="/login">Ir para o login</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se para reservar o Laser Duoglide.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nome completo" htmlFor="full_name" error={errors.full_name?.message} required>
          <Input id="full_name" placeholder="Dra. Maria Silva" {...register("full_name")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="CPF" htmlFor="cpf" error={errors.cpf?.message} required>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              {...register("cpf", {
                onChange: (e) => setValue("cpf", maskCPF(e.target.value)),
              })}
            />
          </Field>
          <Field label="CRM" htmlFor="crm" error={errors.crm?.message} required>
            <Input id="crm" placeholder="CRM-PR 00000" {...register("crm")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Clínica / Consultório" htmlFor="clinic" error={errors.clinic?.message} required>
            <Input id="clinic" placeholder="Nome da clínica" {...register("clinic")} />
          </Field>
        </div>

        <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" placeholder="voce@clinica.com.br" {...register("email")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone" htmlFor="phone" error={errors.phone?.message} required>
            <Input
              id="phone"
              placeholder="(44) 99999-9999"
              {...register("phone", { onChange: (e) => setValue("phone", maskPhone(e.target.value)) })}
            />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password?.message} required>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          </Field>
        </div>

        <Button type="submit" className="w-full" variant="gold" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="text-navy-900" /> : "Criar conta"}
        </Button>
      </form>

      <GoogleButton label="Cadastrar com Google" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
