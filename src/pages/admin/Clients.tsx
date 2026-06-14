import * as React from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, MoreVertical, Search, Trash2, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader, PageLoader } from "@/components/shared/common";
import { useClients, useClientMutations, useReservations } from "@/hooks/api";
import { formatDate, initials } from "@/lib/utils";
import type { Profile } from "@/types";

export default function AdminClients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: reservations = [] } = useReservations();
  const { setBlocked, remove } = useClientMutations();
  const [q, setQ] = React.useState("");
  const [toDelete, setToDelete] = React.useState<Profile | null>(null);

  if (isLoading) return <PageLoader />;

  const filtered = clients.filter(
    (c) =>
      !q ||
      c.full_name.toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()) ||
      c.clinic.toLowerCase().includes(q.toLowerCase()),
  );

  const countFor = (id: string) => reservations.filter((r) => r.user_id === id).length;

  const toggleBlock = async (c: Profile) => {
    await setBlocked.mutateAsync({ id: c.id, blocked: !c.blocked });
    toast.success(c.blocked ? "Cliente reativado." : "Cliente bloqueado.");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await remove.mutateAsync(toDelete.id);
    toast.success("Cliente excluído.");
    setToDelete(null);
  };

  return (
    <div>
      <PageHeader title="Clientes" description={`${clients.length} clientes cadastrados.`} />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por nome, e-mail ou clínica..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={UserCog} title="Nenhum cliente encontrado" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Especialidade</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Reservas</th>
                  <th className="px-4 py-3">Cadastro</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{initials(c.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground">{c.clinic}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{c.specialty}</p>
                      <p className="text-xs text-muted-foreground">{c.crm}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{c.email}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3">{countFor(c.id)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      {c.blocked ? (
                        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">Bloqueado</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Ativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleBlock(c)}>
                            {c.blocked ? <><CheckCircle2 className="h-4 w-4" /> Reativar</> : <><Ban className="h-4 w-4" /> Bloquear</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setToDelete(c)}>
                            <Trash2 className="h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente?</DialogTitle>
            <DialogDescription>
              {toDelete?.full_name} será removido permanentemente. As reservas associadas permanecem no histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
