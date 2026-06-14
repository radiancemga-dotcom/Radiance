import { MessageCircle } from "lucide-react";
import { COMPANY, WHATSAPP_DEFAULT_MESSAGE } from "@/lib/constants";
import { useSettings } from "@/hooks/api";

export function WhatsAppButton() {
  const { data: settings } = useSettings();
  const number = settings?.company_whatsapp || COMPANY.whatsapp;
  const href = `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden text-sm font-semibold sm:inline">WhatsApp</span>
    </a>
  );
}
