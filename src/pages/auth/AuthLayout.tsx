import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { COMPANY } from "@/lib/constants";
import { DATA_MODE } from "@/data";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lado visual */}
      <div className="relative hidden flex-col justify-between overflow-hidden navy-gradient p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
        <Link to="/">
          <Logo variant="light" />
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Tecnologia laser de ponta para a sua clínica
          </h2>
          <p className="mt-4 max-w-md text-white/75">
            Gerencie reservas do {COMPANY.equipment} com agendamento online, logística automática e
            acompanhamento em tempo real.
          </p>
          <ul className="mt-8 space-y-3">
            {["Agendamento 24h", "Logística automática por distância", "Histórico e notificações", "Suporte especializado"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-gold" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} {COMPANY.name} · {COMPANY.city}</p>
      </div>

      {/* Lado do formulário */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          {DATA_MODE === "demo" && (
            <div className="mt-5 rounded-lg border border-gold/30 bg-gold/10 p-3 text-xs text-gold-foreground">
              <strong>Modo demonstração.</strong> Use as contas de teste:
              <br />Cliente — <code>cliente@demo.com</code> / <code>demo123</code>
              <br />Admin — <code>admin@radiancelaser.com.br</code> / <code>admin123</code>
            </div>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
