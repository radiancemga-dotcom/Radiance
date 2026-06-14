import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Download, FileSpreadsheet, FileText, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageLoader, StatCard } from "@/components/shared/common";
import { useFinancial } from "@/hooks/api";
import { formatCurrency } from "@/lib/utils";
import { exportFinanceToPDF, exportToExcel } from "@/lib/export";

export default function AdminFinance() {
  const { data: financial = [], isLoading } = useFinancial();

  if (isLoading) return <PageLoader />;

  const forecast = financial.reduce((s, f) => s + f.amount, 0);
  const received = financial.filter((f) => f.status === "received").reduce((s, f) => s + f.amount, 0);
  const pending = forecast - received;

  const byCity = groupSum(financial, (f) => f.city);
  const byClient = groupSum(financial, (f) => f.client_name);
  const byMonth = groupSum(financial, (f) => f.month);
  const monthChart = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  const statusLabel = (s: string) => (s === "received" ? "Recebido" : "Previsto");

  const downloadExcel = () => {
    exportToExcel("radiance_financeiro", {
      Lancamentos: financial.map((f) => ({
        Data_Mes: f.month,
        Cliente: f.client_name,
        Cidade: f.city,
        Valor: f.amount,
        Situacao: statusLabel(f.status),
      })),
      Por_Cidade: Object.entries(byCity).map(([Cidade, Valor]) => ({ Cidade, Valor })),
      Por_Cliente: Object.entries(byClient).map(([Cliente, Valor]) => ({ Cliente, Valor })),
      Por_Mes: monthChart.map((m) => ({ Mes: m.month, Valor: m.amount })),
    });
  };

  const downloadPDF = () => {
    exportFinanceToPDF(
      "Relatório Financeiro",
      [
        ["Receita prevista", formatCurrency(forecast)],
        ["Receita recebida", formatCurrency(received)],
        ["A receber", formatCurrency(pending)],
        ["Lançamentos", String(financial.length)],
      ],
      financial.map((f) => ({ date: f.month, client: f.client_name, city: f.city, amount: f.amount, status: statusLabel(f.status) })),
    );
  };

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Receitas, previsões e relatórios."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" onClick={downloadPDF}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Receita prevista" value={formatCurrency(forecast)} icon={TrendingUp} accent="navy" />
        <StatCard label="Receita recebida" value={formatCurrency(received)} icon={DollarSign} accent="emerald" />
        <StatCard label="A receber" value={formatCurrency(pending)} icon={Wallet} accent="gold" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Receita por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }} />
              <Bar dataKey="amount" fill="#d8b46a" radius={[6, 6, 0, 0]} name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RankCard title="Receita por cidade" data={byCity} icon={Download} />
        <RankCard title="Receita por cliente" data={byClient} icon={Download} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Lançamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Mês</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {financial.map((f) => (
                  <tr key={f.id} className="border-b">
                    <td className="px-4 py-3">{f.month}</td>
                    <td className="px-4 py-3 font-medium">{f.client_name}</td>
                    <td className="px-4 py-3">{f.city}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(f.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={f.status === "received" ? "text-emerald-600" : "text-amber-600"}>
                        {statusLabel(f.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function groupSum<T>(items: T[], keyFn: (i: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = keyFn(it);
    out[k] = (out[k] ?? 0) + (it as unknown as { amount: number }).amount;
  }
  return out;
}

function RankCard({
  title,
  data,
  icon: Icon,
}: {
  title: string;
  data: Record<string, number>;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 6);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-gold" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          entries.map(([name, value]) => (
            <div key={name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">{name}</span>
                <span>{formatCurrency(value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full gold-gradient" style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
