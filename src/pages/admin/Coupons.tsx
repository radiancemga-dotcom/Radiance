import * as React from "react";
import { toast } from "sonner";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, Field, PageHeader, PageLoader } from "@/components/shared/common";
import { useCoupons, useCouponMutations } from "@/hooks/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CouponType } from "@/types";

export default function AdminCoupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const { upsert, remove } = useCouponMutations();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<{ code: string; discount_type: CouponType; value: number; expires_at: string }>({
    code: "",
    discount_type: "percent",
    value: 10,
    expires_at: "",
  });

  if (isLoading) return <PageLoader />;

  const add = async () => {
    if (!form.code.trim()) return;
    await upsert.mutateAsync({
      code: form.code,
      discount_type: form.discount_type,
      value: form.value,
      active: true,
      expires_at: form.expires_at || null,
    });
    toast.success("Cupom criado.");
    setOpen(false);
    setForm({ code: "", discount_type: "percent", value: 10, expires_at: "" });
  };

  return (
    <div>
      <PageHeader
        title="Cupons"
        description="Crie e gerencie cupons de desconto."
        action={
          <Button variant="gold" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo cupom
          </Button>
        }
      />

      {coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="Nenhum cupom" description="Crie o primeiro cupom de desconto." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Desconto</th>
                  <th className="px-4 py-3">Validade</th>
                  <th className="px-4 py-3">Ativo</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = c.expires_at && c.expires_at < new Date().toISOString().slice(0, 10);
                  return (
                    <tr key={c.id} className="border-b">
                      <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                      <td className="px-4 py-3">
                        {c.discount_type === "percent" ? `${c.value}%` : formatCurrency(c.value)}
                      </td>
                      <td className="px-4 py-3">
                        {c.expires_at ? (
                          <span className={expired ? "text-rose-600" : ""}>
                            {formatDate(c.expires_at)} {expired && "(expirado)"}
                          </span>
                        ) : (
                          <Badge variant="outline">Sem validade</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={c.active}
                          onCheckedChange={(v) =>
                            upsert.mutate({ id: c.id, code: c.code, discount_type: c.discount_type, value: c.value, active: v, expires_at: c.expires_at })
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cupom</DialogTitle>
          </DialogHeader>
          <Field label="Código">
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="Ex.: BEMVINDO10"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo">
              <Select value={form.discount_type} onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as CouponType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.discount_type === "percent" ? "Percentual" : "Valor (R$)"}>
              <Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))} />
            </Field>
          </div>
          <Field label="Validade (opcional)">
            <Input type="date" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="gold" onClick={add} disabled={!form.code.trim()}>Criar cupom</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
