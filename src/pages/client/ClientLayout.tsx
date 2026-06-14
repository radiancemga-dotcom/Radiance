import { Outlet } from "react-router-dom";
import { LayoutDashboard, CalendarPlus, ListChecks, User, Bell } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";

const items: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/nova-reserva", label: "Nova Reserva", icon: CalendarPlus },
  { to: "/app/minhas-reservas", label: "Minhas Reservas", icon: ListChecks },
  { to: "/app/notificacoes", label: "Notificações", icon: Bell },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

export default function ClientLayout() {
  return (
    <AppShell items={items} title="Área do Cliente">
      <Outlet />
      <WhatsAppButton />
    </AppShell>
  );
}
