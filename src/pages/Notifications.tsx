import * as React from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, PageLoader } from "@/components/shared/common";
import { useAuth } from "@/providers/AuthProvider";
import { useNotifications, useNotificationMutations } from "@/hooks/api";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const { userId, isAdmin } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications(userId, isAdmin);
  const { markRead, markAll } = useNotificationMutations(userId, isAdmin);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  if (isLoading) return <PageLoader />;

  const list = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unread = notifications.filter((n) => !n.read).length;
  const base = isAdmin ? "/admin" : "/app";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notificações"
        description={unread > 0 ? `${unread} não lida(s).` : "Tudo em dia."}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={() => markAll.mutate()}>
              <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">Não lidas{unread > 0 ? ` (${unread})` : ""}</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Você está em dia." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {list.map((n) => {
              const inner = (
                <div className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-gold/5"}`}>
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-gold"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{n.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              );
              return n.reservation_id ? (
                <Link
                  key={n.id}
                  to={`${base}/${isAdmin ? "reservas" : `reserva/${n.reservation_id}`}`}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className="block hover:bg-accent/40"
                >
                  {inner}
                </Link>
              ) : (
                <button key={n.id} onClick={() => !n.read && markRead.mutate(n.id)} className="block w-full text-left hover:bg-accent/40">
                  {inner}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
