import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Headphones,
  GraduationCap,
  Truck,
  Clock,
  CheckCircle2,
  Wallet,
  Wrench,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ApplicationsSection, FaqSection, PricingSection } from "./LandingExtras";
import { usePageTitle } from "@/hooks/usePageTitle";
import { COMPANY, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/constants";

const benefits = [
  { icon: Wallet, title: "Sem investimento inicial", desc: "Acesse tecnologia laser de ponta sem o alto custo de compra — preserve seu capital de giro." },
  { icon: Wrench, title: "Manutenção inclusa", desc: "Suporte técnico, manutenção preventiva e corretiva sem custo adicional." },
  { icon: Headphones, title: "Suporte especializado", desc: "Equipe técnica disponível antes, durante e depois do procedimento." },
  { icon: GraduationCap, title: "Treinamento e instalação", desc: "Orientação completa de uso para você e sua equipe, inclusa na locação." },
  { icon: BadgeCheck, title: "Equipamento certificado", desc: `${COMPANY.equipment} sempre revisado, calibrado e atualizado — sem obsolescência.` },
  { icon: Truck, title: "Entrega no mesmo dia", desc: "Logística regional com entrega e retirada no mesmo dia em Maringá e região." },
];

const steps = [
  { icon: CalendarCheck, title: "Escolha a data", desc: "Selecione o dia disponível no calendário online." },
  { icon: Clock, title: "Selecione o período", desc: "Manhã, tarde ou integral — com valores transparentes." },
  { icon: MapPin, title: "Informe o local", desc: "Endereço de atendimento; calculamos a logística automaticamente." },
  { icon: CheckCircle2, title: "Confirme a reserva", desc: "Pronto! Acompanhe tudo pela sua área do cliente." },
];

export default function LandingPage() {
  usePageTitle();
  const whatsappHref = `https://wa.me/${COMPANY.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* HERO */}
      <section className="relative overflow-hidden navy-gradient text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-navy-400/20 blur-3xl" />
        <div className="container relative grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> {COMPANY.equipment} · {COMPANY.city}
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-tight md:text-5xl">
              Locação de Laser Médico para Clínicas e Consultórios
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/80">
              Equipamentos modernos, suporte especializado e agendamento online.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="gold">
                <Link to="/cadastro">
                  Reservar Agora <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center">
              <Stat value="+50" label="Clínicas atendidas" />
              <Stat value="Mesmo dia" label="Entrega e retirada" />
              <Stat value="100% online" label="Agendamento" />
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-2 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 p-8">
                <EquipmentVisual />
                <p className="mt-6 text-center font-display text-xl font-semibold">{COMPANY.equipment}</p>
                <p className="mt-1 text-center text-sm text-white/60">Laser de CO₂ fracionado híbrido para dermatologia e ginecologia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section id="beneficios" className="container py-20">
        <SectionTitle eyebrow="Por que a Radiance" title="Benefícios para a sua clínica" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="group rounded-xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-50 text-navy-700 transition group-hover:gold-gradient group-hover:text-navy-900">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-muted/40 py-20">
        <div className="container">
          <SectionTitle eyebrow="Simples e rápido" title="Como funciona" />
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border bg-card p-6 shadow-sm">
                <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full gold-gradient text-sm font-bold text-navy-900">
                  {i + 1}
                </span>
                <s.icon className="mt-2 h-8 w-8 text-gold" />
                <h3 className="mt-3 font-display font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" variant="gold">
              <Link to="/cadastro">Começar agora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <PricingSection />

      {/* APLICAÇÕES */}
      <ApplicationsSection />

      {/* SOBRE */}
      <section id="sobre" className="container py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Quem somos" title="Sobre a Radiance Laser" align="left" />
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                A <strong className="text-foreground">{COMPANY.name}</strong> nasceu em {COMPANY.city} com um
                propósito claro: aproximar a tecnologia laser de alta performance dos profissionais de saúde
                e estética da nossa região. Acreditamos que um equipamento de ponta não deveria ser privilégio
                de poucos — e por isso oferecemos a locação por período, sem o alto custo de aquisição e
                manutenção.
              </p>
              <p>
                Nosso equipamento principal é o <strong className="text-foreground">{COMPANY.equipment}</strong>,
                versátil e indicado para uma ampla gama de procedimentos. Cada locação acompanha suporte técnico
                especializado, orientação de uso e uma operação logística própria, com{" "}
                <strong className="text-foreground">entrega e retirada no mesmo dia</strong> em Maringá e região.
              </p>
              <p>
                Mais do que alugar equipamentos, queremos ser parceiros do crescimento da sua clínica —
                com atendimento próximo, transparência nos valores e a confiança de quem está sempre por perto.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { icon: Truck, t: "Logística própria", d: "Entrega e retirada no mesmo dia" },
                { icon: ShieldCheck, t: "Confiabilidade", d: "Equipamentos revisados" },
                { icon: Headphones, t: "Suporte", d: "Atendimento dedicado" },
                { icon: GraduationCap, t: "Capacitação", d: "Treinamento incluso" },
              ].map((x) => (
                <div key={x.t} className="flex gap-3 rounded-lg border bg-card p-4">
                  <x.icon className="h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <p className="text-sm font-semibold">{x.t}</p>
                    <p className="text-xs text-muted-foreground">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl navy-gradient p-10 text-white shadow-xl">
            <h3 className="font-display text-2xl font-bold">Pronto para atender mais pacientes?</h3>
            <p className="mt-3 text-white/80">
              Cadastre-se gratuitamente e faça sua primeira reserva em minutos. Sem mensalidade — você paga
              apenas pelos períodos que utilizar.
            </p>
            <ul className="mt-6 space-y-3">
              {["Cadastro gratuito", "Agendamento 24h online", "Valores transparentes", "Histórico completo"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-gold" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="gold" className="mt-8 w-full">
              <Link to="/cadastro">Criar minha conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      <Footer />
      <WhatsAppButton />
    </div>
  );
}

/**
 * Mostra a foto do equipamento se existir em /equipamento.jpg (coloque o
 * arquivo na pasta `public/`). Enquanto não houver foto, exibe um visual
 * estilizado de reserva.
 */
const EQUIPMENT_IMAGES = ["/equipamento.png", "/equipamento.jpg", "/equipamento.webp"];

function EquipmentVisual() {
  const [idx, setIdx] = useState(0);
  if (idx < EQUIPMENT_IMAGES.length) {
    return (
      <div className="mx-auto flex max-w-[16rem] items-center justify-center rounded-xl bg-white p-4 shadow-lg">
        <img
          src={EQUIPMENT_IMAGES[idx]}
          alt={`${COMPANY.equipment} — equipamento de laser`}
          onError={() => setIdx((i) => i + 1)}
          className="max-h-72 w-auto object-contain"
        />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-4 border-gold/40">
      <div className="flex h-32 w-32 items-center justify-center rounded-full gold-gradient">
        <Sparkles className="h-14 w-14 text-navy-900" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-lg font-bold text-gold">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <span className="text-sm font-semibold uppercase tracking-wider text-gold">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
    </div>
  );
}
