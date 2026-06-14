import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  Truck,
  DollarSign,
  Settings,
  Zap,
  Ticket,
  Bell,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";

const items: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/admin/reservas", label: "Reservas", icon: ClipboardList },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/logistica", label: "Logística", icon: Truck },
  { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/admin/equipamentos", label: "Equipamentos", icon: Zap },
  { to: "/admin/cupons", label: "Cupons", icon: Ticket },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout() {
  return (
    <AppShell items={items} title="Painel Administrativo">
      <Outlet />
    </AppShell>
  );
}
