import * as React from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Sun, Sunset, Sparkles, Star, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/api";
import { PERIODS } from "@/lib/constants";
import { calcPrice } from "@/lib/pricing";
import { formatCurrency, cn } from "@/lib/utils";

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-semibold uppercase tracking-wider text-gold">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/* ---------------------------- Planos e valores ---------------------------- */
export function PricingSection() {
  const { data: settings } = useSettings();
  const half = settings?.price_half_period ?? 2000;
  const full = settings ? calcPrice("full", settings) : 3600;
  const discount = settings?.full_day_discount_pct ?? 10;

  const plans = [
    { key: "morning" as const, icon: Sun, price: half, highlight: false, perks: ["07h00 às 12h00", "Suporte técnico incluso", "Entrega e retirada no mesmo dia"] },
    { key: "full" as const, icon: Sparkles, price: full, highlight: true, perks: ["07h00 às 18h00", `Desconto de ${discount}% aplicado`, "Suporte técnico incluso", "Ideal para alto volume"] },
    { key: "afternoon" as const, icon: Sunset, price: half, highlight: false, perks: ["13h00 às 18h00", "Suporte técnico incluso", "Entrega e retirada no mesmo dia"] },
  ];

  return (
    <section id="planos" className="container py-20">
      <SectionTitle
        eyebrow="Planos e valores"
        title="Pague apenas pelo período que usar"
        subtitle="Sem mensalidade e sem fidelidade. Escolha o período que faz sentido para a sua agenda."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.key}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md",
              p.highlight && "border-gold ring-1 ring-gold",
            )}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gold-gradient px-3 py-0.5 text-xs font-semibold text-navy-900">
                Mais econômico
              </span>
            )}
            <p.icon className={cn("h-7 w-7", p.highlight ? "text-gold" : "text-muted-foreground")} />
            <h3 className="mt-3 font-display text-lg font-semibold">{PERIODS[p.key].label}</h3>
            <p className="mt-3">
              <span className="font-display text-3xl font-bold text-foreground">{formatCurrency(p.price)}</span>
              <span className="text-sm text-muted-foreground"> / diária</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {perk}
                </li>
              ))}
            </ul>
            <Button asChild variant={p.highlight ? "gold" : "outline"} className="mt-6 w-full">
              <Link to="/cadastro">Reservar {PERIODS[p.key].label.toLowerCase()}</Link>
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        * Atendimentos acima de {settings?.long_distance_km ?? 250} km de Maringá ocupam o dia inteiro. Valores configuráveis e sujeitos à disponibilidade.
      </p>
    </section>
  );
}

/* --------------------------- Aplicações do laser -------------------------- */
const applications = [
  "Rejuvenescimento facial",
  "Tratamento de cicatrizes e acne",
  "Resurfacing fracionado (CO₂)",
  "Manchas e melasma",
  "Estímulo de colágeno",
  "Ginecologia e saúde íntima",
];

export function ApplicationsSection() {
  return (
    <section className="bg-muted/40 py-20">
      <div className="container grid items-center gap-12 md:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Tecnologia" title="O que o DEKA DUOGlide entrega" />
          <p className="mt-6 text-muted-foreground">
            Laser de <strong className="text-foreground">CO₂ fracionado híbrido</strong> (10600 nm + 1540 nm),
            que une tratamentos ablativos e não ablativos em um só equipamento — versatilidade para uma ampla
            gama de procedimentos dermatológicos e ginecológicos, com a segurança e o suporte da Radiance Laser.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {applications.map((a) => (
              <div key={a} className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm">
                <Stethoscope className="h-4 w-4 shrink-0 text-gold" /> {a}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl navy-gradient p-8 text-white shadow-xl">
          <div className="flex items-center gap-1 text-gold">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-gold" />
            ))}
          </div>
          <blockquote className="mt-4 font-display text-xl leading-relaxed">
            “Poder alugar o equipamento por período transformou a forma como ofereço procedimentos a laser
            na minha clínica — sem o investimento de compra.”
          </blockquote>
          <p className="mt-4 text-sm text-white/70">— Depoimento ilustrativo de cliente</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ----------------------------------- */
const faqs = [
  { q: "Como funciona a locação por período?", a: "Você escolhe manhã (07h–12h), tarde (13h–18h) ou o dia inteiro (integral). O equipamento é entregue e retirado no mesmo dia, no endereço de atendimento informado." },
  { q: "Quais são os valores?", a: "O meio período tem um valor fixo e a diária integral recebe um desconto automático. Os valores aparecem na seção de planos e no momento da reserva, sempre de forma transparente." },
  { q: "Vocês atendem fora de Maringá?", a: "Sim. Atendemos Maringá e região. Para distâncias acima do limite configurado (em torno de 250 km), a reserva ocupa o dia inteiro por questões logísticas — o sistema calcula isso automaticamente ao criar a reserva." },
  { q: "Preciso ter experiência com o equipamento?", a: "Oferecemos orientação de uso e suporte especializado. Recomendamos que o procedimento seja realizado por profissional habilitado." },
  { q: "Como faço para reservar?", a: "Crie sua conta gratuitamente, escolha a data e o período no calendário, informe o local de atendimento e confirme. Você acompanha tudo pela sua área do cliente." },
  { q: "Posso cancelar ou reagendar?", a: "Sim. Reservas pendentes ou confirmadas podem ser canceladas ou reagendadas pela sua área do cliente, sujeito à disponibilidade da agenda." },
];

export function FaqSection() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <section id="faq" className="container py-20">
      <SectionTitle eyebrow="Dúvidas" title="Perguntas frequentes" />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-gold transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && <p className="px-5 pb-4 text-sm text-muted-foreground">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
