import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY, PERIODS, STATUS_META } from "./constants";
import { formatCurrency, formatDate, formatNumber } from "./utils";
import type { Reservation } from "@/types";

export function exportToExcel(filename: string, sheets: Record<string, Array<Record<string, unknown>>>) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** Gera um recibo/comprovante de reserva em PDF. */
export function exportReservationPDF(r: Reservation, company?: { name?: string; phone?: string; email?: string }) {
  const doc = new jsPDF();
  const name = company?.name || COMPANY.name;

  // Cabeçalho
  doc.setFillColor(36, 59, 102);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(name, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(216, 180, 106);
  doc.text("Comprovante de Reserva — " + COMPANY.equipment, 14, 23);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`Protocolo: ${r.id}`, 14, 38);
  doc.text(`Emitido em ${formatDate(new Date())}`, 14, 43);
  doc.text(`Situação: ${STATUS_META[r.status].label}`, 150, 38);

  autoTable(doc, {
    startY: 50,
    head: [["Dados da reserva", ""]],
    body: [
      ["Cliente", r.client_name],
      ["E-mail / Telefone", `${r.client_email}  ·  ${r.client_phone}`],
      ["Equipamento", r.equipment_name || "—"],
      ["Clínica", r.clinic_name],
      ["Data", formatDate(r.date, { weekday: "long", day: "2-digit", month: "long", year: "numeric" })],
      ["Período", `${PERIODS[r.effective_period].label} (${PERIODS[r.effective_period].hours})`],
      ["Procedimentos", r.procedures],
      ["Endereço", `${r.address}, ${r.city} - ${r.state}, ${r.cep}`],
      ["Observações", r.notes || "—"],
    ],
    theme: "grid",
    headStyles: { fillColor: [36, 59, 102] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  autoTable(doc, {
    // @ts-expect-error lastAutoTable é adicionado em runtime pelo plugin
    startY: (doc.lastAutoTable?.finalY ?? 120) + 6,
    head: [["Logística", ""]],
    body: [
      ["Origem", `${COMPANY.city}`],
      ["Distância", `${formatNumber(r.distance_km)} km`],
      ["Tempo estimado", r.travel_minutes ? `${Math.floor(r.travel_minutes / 60)}h ${r.travel_minutes % 60}min` : "—"],
      ["Tipo", r.is_long_distance ? "Longa distância (dia inteiro)" : "Por período"],
    ],
    theme: "grid",
    headStyles: { fillColor: [36, 59, 102] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });

  // Valor em destaque
  // @ts-expect-error lastAutoTable em runtime
  const y = (doc.lastAutoTable?.finalY ?? 180) + 10;
  doc.setFillColor(245, 247, 250);
  doc.rect(14, y, 182, 16, "F");
  doc.setTextColor(36, 59, 102);
  doc.setFontSize(11);
  doc.text("Valor total da locação", 18, y + 10);
  doc.setFontSize(14);
  doc.text(formatCurrency(r.price), 196, y + 10, { align: "right" });

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(
    `${name}  ·  ${company?.phone || COMPANY.phone}  ·  ${company?.email || COMPANY.email}  ·  ${COMPANY.city}`,
    14,
    285,
  );

  doc.save(`reserva_${r.city}_${r.date}.pdf`.replace(/\s+/g, "_").toLowerCase());
}

/** Exporta uma lista de reservas para PDF (tabela). */
export function exportReservationsPDF(
  rows: Array<{ date: string; client: string; city: string; period: string; price: number; status: string }>,
  subtitle?: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(36, 59, 102);
  doc.text(`${COMPANY.name} — Reservas`, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`${subtitle ?? "Lista de reservas"} · gerado em ${formatDate(new Date())}`, 14, 25);

  autoTable(doc, {
    startY: 31,
    head: [["Data", "Cliente", "Cidade", "Período", "Valor", "Status"]],
    body: rows.map((r) => [formatDate(r.date), r.client, r.city, r.period, formatCurrency(r.price), r.status]),
    theme: "striped",
    headStyles: { fillColor: [36, 59, 102] },
    styles: { fontSize: 8 },
  });

  const total = rows.reduce((s, r) => s + r.price, 0);
  // @ts-expect-error lastAutoTable em runtime
  const y = (doc.lastAutoTable?.finalY ?? 40) + 8;
  doc.setFontSize(10);
  doc.setTextColor(36, 59, 102);
  doc.text(`Total (${rows.length} reservas): ${formatCurrency(total)}`, 14, y);

  doc.save("radiance_reservas.pdf");
}

/** Relatório de logística em PDF. */
export function exportLogisticsPDF(
  cities: Array<{ name: string; state: string; distance_km: number; rule: string }>,
  summary: Array<[string, string]>,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(36, 59, 102);
  doc.text(`${COMPANY.name} — Relatório de Logística`, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Origem: ${COMPANY.city} · gerado em ${formatDate(new Date())}`, 14, 25);

  autoTable(doc, {
    startY: 31,
    head: [["Indicador", "Valor"]],
    body: summary,
    theme: "grid",
    headStyles: { fillColor: [36, 59, 102] },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    // @ts-expect-error lastAutoTable em runtime
    startY: (doc.lastAutoTable?.finalY ?? 60) + 8,
    head: [["Cidade", "UF", "Distância (km)", "Regra"]],
    body: cities.map((c) => [c.name, c.state, formatNumber(c.distance_km), c.rule]),
    theme: "striped",
    headStyles: { fillColor: [36, 59, 102] },
    styles: { fontSize: 8 },
  });

  doc.save("radiance_logistica.pdf");
}

export function exportFinanceToPDF(
  title: string,
  summary: Array<[string, string]>,
  rows: Array<{ date: string; client: string; city: string; amount: number; status: string }>,
) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(36, 59, 102);
  doc.text(COMPANY.name, 14, 18);
  doc.setFontSize(12);
  doc.setTextColor(80);
  doc.text(title, 14, 26);
  doc.setFontSize(9);
  doc.text(`Gerado em ${formatDate(new Date())} · ${COMPANY.city}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Indicador", "Valor"]],
    body: summary,
    theme: "grid",
    headStyles: { fillColor: [36, 59, 102] },
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    // @ts-expect-error lastAutoTable is added by the plugin at runtime
    startY: (doc.lastAutoTable?.finalY ?? 60) + 8,
    head: [["Data", "Cliente", "Cidade", "Valor", "Situação"]],
    body: rows.map((r) => [formatDate(r.date), r.client, r.city, formatCurrency(r.amount), r.status]),
    theme: "striped",
    headStyles: { fillColor: [36, 59, 102] },
    styles: { fontSize: 8 },
  });

  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}
