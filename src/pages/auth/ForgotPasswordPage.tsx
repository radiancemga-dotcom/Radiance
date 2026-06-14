import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Spinner } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { usePageTitle } from "@/hooks/usePageTitle";

const schema = z.object({ email: z.string().email("E-mail inválido") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  usePageTitle("Recuperar senha");
  const { resetPassword } = useAuth();
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha.">
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
            Se houver uma conta com esse e-mail, você receberá um link de recuperação em instantes.
          </div>
          <Button asChild className="w-full" variant="gold">
            <Link to="/login">Voltar ao login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
            <Input id="email" type="email" placeholder="voce@clinica.com.br" {...register("email")} />
          </Field>
          <Button type="submit" className="w-full" variant="gold" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="text-navy-900" /> : "Enviar link de recuperação"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
