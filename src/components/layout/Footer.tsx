import { Mail, MapPin, Phone, Instagram, Clock } from "lucide-react";
import { Logo } from "./Logo";
import { COMPANY } from "@/lib/constants";
import { useSettings } from "@/hooks/api";

export function Footer() {
  const { data: settings } = useSettings();
  const phone = settings?.company_phone || COMPANY.phone;
  const email = settings?.company_email || COMPANY.email;

  return (
    <footer id="contato" className="navy-gradient text-white">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo variant="light" />
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Locação de laser médico {COMPANY.equipment} para clínicas e consultórios. Sediada em {COMPANY.city},
            atendendo Maringá e região com agendamento online e suporte especializado.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={`https://instagram.com/${COMPANY.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={`https://instagram.com/${COMPANY.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/70 hover:text-white"
            >
              @{COMPANY.instagram}
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold text-gold">Contato</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" /> {phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" /> {email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" /> {COMPANY.city}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" /> Seg a Sáb, 7h às 19h
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-gold">Navegação</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li><a href="#beneficios" className="hover:text-white">Benefícios</a></li>
            <li><a href="#como-funciona" className="hover:text-white">Como Funciona</a></li>
            <li><a href="#sobre" className="hover:text-white">Sobre</a></li>
            <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            <li><a href="/login" className="hover:text-white">Área do Cliente</a></li>
            <li><a href="/termos" className="hover:text-white">Termos de Uso</a></li>
            <li><a href="/privacidade" className="hover:text-white">Política de Privacidade</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-center gap-2 py-5 text-center text-xs text-white/50 sm:flex-row sm:justify-between sm:text-left">
          <span>© {new Date().getFullYear()} {COMPANY.name}. Todos os direitos reservados.</span>
          <span className="flex items-center gap-3">
            <a href="/termos" className="hover:text-white">Termos</a>
            <a href="/privacidade" className="hover:text-white">Privacidade</a>
            <span>Maringá · PR</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
