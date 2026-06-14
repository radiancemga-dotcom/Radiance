import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";

const links = [
  { href: "#beneficios", label: "Benefícios" },
  { href: "#como-funciona", label: "Como Funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#sobre", label: "Sobre" },
  { href: "#faq", label: "FAQ" },
  { href: "#contato", label: "Contato" },
];

export function PublicNav() {
  const [open, setOpen] = React.useState(false);
  const { userId, isAdmin } = useAuth();
  const navigate = useNavigate();

  const goApp = () => navigate(userId ? (isAdmin ? "/admin" : "/app") : "/login");

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button variant="ghost" onClick={goApp}>
            {userId ? "Minha conta" : "Entrar"}
          </Button>
          <Button variant="gold" onClick={() => navigate(userId ? "/app/nova-reserva" : "/cadastro")}>
            Reservar Agora
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="container flex flex-col gap-1 py-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="outline" onClick={goApp}>
                {userId ? "Minha conta" : "Entrar"}
              </Button>
              <Button variant="gold" onClick={() => navigate(userId ? "/app/nova-reserva" : "/cadastro")}>
                Reservar Agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
