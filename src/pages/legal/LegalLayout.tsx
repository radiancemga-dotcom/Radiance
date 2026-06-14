import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="navy-gradient text-white">
        <div className="container py-12">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-white/60">Última atualização: {updatedAt}</p>
        </div>
      </div>

      <article className="container max-w-3xl py-12">
        <div className="prose-legal space-y-6 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </div>
      </article>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

/** Bloco de seção com título. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
