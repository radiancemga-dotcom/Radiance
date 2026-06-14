import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { GuestOnly, RequireAdmin, RequireAuth } from "@/routes/guards";
import { PageLoader } from "@/components/shared/common";

// Landing e auth carregam logo (fluxo de entrada)
import LandingPage from "@/pages/landing/LandingPage";
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));

// Área do cliente (lazy)
const ClientLayout = lazy(() => import("@/pages/client/ClientLayout"));
const ClientDashboard = lazy(() => import("@/pages/client/Dashboard"));
const NewReservation = lazy(() => import("@/pages/client/NewReservation"));
const MyReservations = lazy(() => import("@/pages/client/MyReservations"));
const ReservationDetail = lazy(() => import("@/pages/client/ReservationDetail"));
const ClientProfile = lazy(() => import("@/pages/client/Profile"));

// Painel administrativo (lazy — inclui FullCalendar, Recharts, Excel/PDF)
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminAgenda = lazy(() => import("@/pages/admin/Agenda"));
const AdminReservations = lazy(() => import("@/pages/admin/Reservations"));
const AdminClients = lazy(() => import("@/pages/admin/Clients"));
const AdminLogistics = lazy(() => import("@/pages/admin/Logistics"));
const AdminFinance = lazy(() => import("@/pages/admin/Finance"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminEquipment = lazy(() => import("@/pages/admin/Equipment"));
const AdminCoupons = lazy(() => import("@/pages/admin/Coupons"));

const NotificationsPage = lazy(() => import("@/pages/Notifications"));
const TermsPage = lazy(() => import("@/pages/legal/Terms"));
const PrivacyPage = lazy(() => import("@/pages/legal/Privacy"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><PageLoader /></div>}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/cadastro" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/recuperar-senha" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />

      <Route path="/termos" element={<TermsPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />

        {/* Área do cliente */}
        <Route path="/app" element={<RequireAuth><ClientLayout /></RequireAuth>}>
          <Route index element={<ClientDashboard />} />
          <Route path="nova-reserva" element={<NewReservation />} />
          <Route path="minhas-reservas" element={<MyReservations />} />
          <Route path="reserva/:id" element={<ReservationDetail />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="perfil" element={<ClientProfile />} />
        </Route>

        {/* Painel administrativo */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="agenda" element={<AdminAgenda />} />
          <Route path="reservas" element={<AdminReservations />} />
          <Route path="clientes" element={<AdminClients />} />
          <Route path="logistica" element={<AdminLogistics />} />
          <Route path="financeiro" element={<AdminFinance />} />
          <Route path="equipamentos" element={<AdminEquipment />} />
          <Route path="cupons" element={<AdminCoupons />} />
          <Route path="notificacoes" element={<NotificationsPage />} />
          <Route path="configuracoes" element={<AdminSettings />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
