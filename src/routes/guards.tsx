import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { PageLoader } from "@/components/shared/common";

/** Exige usuário autenticado. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, userId } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!userId) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

/** Exige papel de administrador. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { loading, userId, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!userId) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/** Apenas para visitantes (redireciona já logados). */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { loading, userId, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (userId) return <Navigate to={isAdmin ? "/admin" : "/app"} replace />;
  return <>{children}</>;
}
