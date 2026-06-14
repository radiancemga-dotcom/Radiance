import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 px-4 text-center">
      <Logo />
      <div>
        <p className="font-display text-6xl font-bold text-primary">404</p>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      </div>
      <Button asChild variant="gold">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
