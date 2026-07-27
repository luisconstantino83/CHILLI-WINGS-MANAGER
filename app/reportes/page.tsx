"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { FileDown, Printer } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ComparacionCerveza } from "@/lib/types";

function fechaHace(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [comparaciones, setComparaciones] = useState<ComparacionCerveza[]>([]);
  const [loading, setLoading] = useState(true);
  const desde = fechaHace(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("v_comparacion_cerveza")
        .select("*")
        .gte("fecha", desde)
        .order("fecha");
      setComparaciones(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, desde]);

  // Group by day: count faltantes / sobrantes
  const porDia = useMemo(() => {
    const map: Record<string, { fecha: string; faltantes: number; sobrantes: number }> = {};
    comparaciones.forEach((c) => {
      map[c.fecha] ??= { fecha: c.fecha, faltantes: 0, sobrantes: 0 };
      if (c.diferencia < 0) map[c.fecha].faltantes += 1;
      if (c.diferencia > 0) map[c.fecha].sobrantes += 1;
    });
    return Object.values(map).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [comparaciones]);

  // Group by beer: total diferencia (most problematic beers)
  const porCerveza = useMemo(() => {
    const map: Record<string, { nombre: string; diferenciaTotal: number }> = {};
    comparaciones.forEach((c) => {
      map[c.cerveza_nombre] ??= { nombre: c.cerveza_nombre, diferenciaTotal: 0 };
      map[c.cerveza_nombre].diferenciaTotal += Math.abs(c.diferencia);
    });
    return Object.values(map)
      .sort((a, b) => b.diferenciaTotal - a.diferenciaTotal)
      .slice(0, 8);
  }, [comparaciones]);

  async function exportarExcel() {
    const XLSX = await import("xlsx");
    const rows = comparaciones.map((c) => ({
      Fecha: c.fecha,
      Cerveza: c.cerveza_nombre,
      "Inv. anterior": c.inventario_anterior,
      "Venta sistema": c.venta_sistema,
      Cortesías: c.cortesias,
      Merma: c.merma,
      Ajuste: c.ajuste,
      Esperado: c.esperado,
      Contado: c.contado,
      Diferencia: c.diferencia,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cerveza últimos 30 días");
    XLSX.writeFile(wb, `reporte-cerveza-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportarPDF() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Reportes</h1>
          <p className="text-sm text-neutral-500">Últimos 30 días · cerveza</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 rounded-lg border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-200 hover:bg-base-800"
          >
            <FileDown size={15} /> Exportar Excel
          </button>
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 rounded-lg bg-chilli px-3 py-1.5 text-sm font-medium text-white shadow-glow hover:opacity-90"
          >
            <Printer size={15} /> Reporte PDF
          </button>
        </div>
      </div>

      {loading ? (
        <Card><p className="text-sm text-neutral-500">Cargando…</p></Card>
      ) : comparaciones.length === 0 ? (
        <Card><p className="text-sm text-neutral-500">Aún no hay suficiente historial de cerveza para graficar.</p></Card>
      ) : (
        <>
          <Card>
            <h2 className="mb-4 font-display text-base font-semibold text-white">
              Faltantes y sobrantes por día
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={porDia}>
                  <CartesianGrid stroke="#232329" strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" stroke="#5c5c66" fontSize={11} />
                  <YAxis stroke="#5c5c66" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#17171b", border: "1px solid #232329", fontSize: 12 }} />
                  <Line type="monotone" dataKey="faltantes" stroke="#f04a4a" strokeWidth={2} name="Faltantes" />
                  <Line type="monotone" dataKey="sobrantes" stroke="#e3a008" strokeWidth={2} name="Sobrantes" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-display text-base font-semibold text-white">
              Cervezas con más diferencias (30 días)
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCerveza} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="#232329" strokeDasharray="3 3" />
                  <XAxis type="number" stroke="#5c5c66" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="nombre" type="category" stroke="#5c5c66" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ background: "#17171b", border: "1px solid #232329", fontSize: 12 }} />
                  <Bar dataKey="diferenciaTotal" fill="#d62828" radius={[0, 4, 4, 0]} name="Diferencia acumulada" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      <p className="text-xs text-neutral-600">
        * Este reporte usa los datos de cerveza. Las gráficas de barra, postres y material se agregan en
        la siguiente iteración una vez que tengas más historial acumulado.
      </p>
    </div>
  );
}
