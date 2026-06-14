import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { GoogleButton } from "./GoogleButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Spinner } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { usePageTitle } from "@/hooks/usePageTitle";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  usePageTitle("Entrar");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = React.useState(false);
  const from = (location.state as { from?: string })?.from;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const role = await signIn(data.email, data.password);
      toast.success("Bem-vindo(a) de volta!");
      const dest = role === "admin" ? "/admin" : "/app";
      // respeita a rota de origem apenas se compatível com o papel do usuário
      const target = from && from.startsWith(role === "admin" ? "/admin" : "/app") ? from : dest;
      navigate(target, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para gerenciar suas reservas.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" placeholder="voce@clinica.com.br" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Senha" htmlFor="password" error={errors.password?.message} required>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" className="w-full" variant="gold" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="text-navy-900" /> : "Entrar"}
        </Button>
      </form>

      <GoogleButton label="Entrar com Google" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link to="/cadastro" className="font-medium text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
