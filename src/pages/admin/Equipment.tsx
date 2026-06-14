import * as React from "react";
import { toast } from "sonner";
import { Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Field, PageHeader, PageLoader } from "@/components/shared/common";
import { useEquipment, useEquipmentMutations } from "@/hooks/api";

export default function AdminEquipment() {
  const { data: equipment = [], isLoading } = useEquipment();
  const { upsert, remove } = useEquipmentMutations();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", description: "" });

  if (isLoading) return <PageLoader />;

  const add = async () => {
    if (!form.name.trim()) return;
    await upsert.mutateAsync({ name: form.name, description: form.description, active: true });
    toast.success("Equipamento adicionado.");
    setOpen(false);
    setForm({ name: "", description: "" });
  };

  return (
    <div>
      <PageHeader
        title="Equipamentos"
        description="Gerencie os equipamentos disponíveis para locação."
        action={
          <Button variant="gold" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo equipamento
          </Button>
        }
      />

      {equipment.length === 0 ? (
        <EmptyState icon={Zap} title="Nenhum equipamento" description="Adicione o primeiro equipamento." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {equipment.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display font-semibold">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{e.description || "—"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(e.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-muted-foreground">Disponível para locação</span>
                  <Switch
                    checked={e.active}
                    onCheckedChange={(v) => upsert.mutate({ id: e.id, name: e.name, description: e.description, active: v })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo equipamento</DialogTitle>
          </DialogHeader>
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Laser Duoglide" />
          </Field>
          <Field label="Descrição">
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do equipamento" />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="gold" onClick={add} disabled={!form.name.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
