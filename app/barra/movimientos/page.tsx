"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import Link from "next/link";
import { Save, ArrowLeft } from "lucide-react";
import type { BarraItem } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type Fila = {
  existencia_inicial: number;
  entradas: number;
  bajada_almacen: number;
  consumo: number;
  merma: number;
  ajuste: number;
  existencia_final_contada: number | null;
  responsable: string;
  observaciones: string;
};

const filaVacia: Fila = {
  existencia_inicial: 0,
  entradas: 0,
  bajada_almacen: 0,
  consumo: 0,
  merma: 0,
  ajuste: 0,
  existencia_final_contada: null,
  responsable: "",
  observaciones: "",
};

export default function MovimientosBarraPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fecha, setFecha] = useState(todayISO());
  const [items, setItems] = useState<BarraItem[]>([]);
  const [filas, setFilas] = useState<Record<string, Fila>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSavedMsg("");
      const ayer = new Date(fecha + "T00:00:00");
      ayer.setDate(ayer.getDate() - 1);

      const [{ data: its }, { data: hoy }, { data: ayerMov }] = await Promise.all([
        supabase.from("barra_items").select("*").eq("activo", true).order("orden"),
        supabase.from("movimientos_barra_diarios").select("*").eq("fecha", fecha),
        supabase
          .from("movimientos_barra_diarios")
          .select("item_id, existencia_final_contada, existencia_teorica")
          .eq("fecha", ayer.toISOString().slice(0, 10)),
      ]);
      setItems(its ?? []);

      const ayerMap: Record<string, number> = {};
      (ayerMov ?? []).forEach((m: any) => {
        ayerMap[m.item_id] = m.existencia_final_contada ?? m.existencia_teorica ?? 0;
      });

      const map: Record<string, Fila> = {};
      (its ?? []).forEach((item) => {
        const existente = (hoy ?? []).find((h: any) => h.item_id === item.id);
        map[item.id] = existente
          ? {
              existencia_inicial: existente.existencia_inicial,
              entradas: existente.entradas,
              bajada_almacen: existente.bajada_almacen,
              consumo: existente.consumo,
              merma: existente.merma,
              ajuste: existente.ajuste,
              existencia_final_contada: existente.existencia_final_contada,
              responsable: existente.responsable ?? "",
              observaciones: existente.observaciones ?? "",
            }
          : { ...filaVacia, existencia_inicial: ayerMap[item.id] ?? 0 };
      });
      setFilas(map);
      setLoading(false);
    }
    load();
  }, [supabase, fecha]);

  function update(id: string, campo: keyof Fila, valor: string) {
    setFilas((prev) => {
      const fila = { ...prev[id] };
      if (campo === "responsable" || campo === "observaciones") {
        (fila[campo] as string) = valor;
      } else {
        const num = valor === "" ? (campo === "existencia_final_contada" ? null : 0) : parseFloat(valor);
        (fila[campo] as number | null) = isNaN(num as number) ? null : num;
      }
      return { ...prev, [id]: fila };
    });
  }

  function teorico(f: Fila) {
    return f.existencia_inicial + f.entradas + f.bajada_almacen - f.consumo - f.merma + f.ajuste;
  }

  async function guardar() {
    setSaving(true);
    const rows = items.map((item) => {
      const f = filas[item.id] ?? filaVacia;
      return {
        fecha,
        item_id: item.id,
        existencia_inicial: f.existencia_inicial,
        entradas: f.entradas,
        bajada_almacen: f.bajada_almacen,
        consumo: f.consumo,
        merma: f.merma,
        ajuste: f.ajuste,
        existencia_final_contada: f.existencia_final_contada,
        responsable: f.responsable || null,
        observaciones: f.observaciones || null,
      };
    });
    const { error } = await supabase
      .from("movimientos_barra_diarios")
      .upsert(rows, { onConflict: "fecha,item_id" });
    setSaving(false);
    setSavedMsg(error ? `Error: ${error.message}` : "Movimientos guardados ✓");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link href="/barra" className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300">
          <ArrowLeft size={12} /> Volver a inventario semanal
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">Movimientos diarios de barra</h1>
            <p className="text-sm text-neutral-500">
              Distinto al inventario semanal del jueves — esto es lo que se usó, entró o se ajustó hoy
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-lg border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-200"
            />
            <button
              onClick={guardar}
              disabled={saving || loading}
              className="flex items-center gap-2 rounded-lg bg-chilli px-4 py-1.5 text-sm font-medium text-white shadow-glow hover:opacity-90 disabled:opacity-50"
            >
              <Save size={15} /> {saving ? "Guardando…" : "Guardar día"}
            </button>
          </div>
        </div>
      </div>

      {savedMsg && (
        <p className={savedMsg.startsWith("Error") ? "text-sm text-chilli-light" : "text-sm text-ok"}>{savedMsg}</p>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-base-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-3">Producto</th>
                <th className="px-2 py-2">Inicial</th>
                <th className="px-2 py-2">Entradas</th>
                <th className="px-2 py-2">Bajada</th>
                <th className="px-2 py-2">Consumo</th>
                <th className="px-2 py-2">Merma</th>
                <th className="px-2 py-2">Ajuste</th>
                <th className="px-2 py-2">Teórico</th>
                <th className="px-2 py-2">Contado</th>
                <th className="px-2 py-2">Dif.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="py-6 text-center text-neutral-500">Cargando…</td></tr>
              ) : (
                items.map((item) => {
                  const f = filas[item.id] ?? filaVacia;
                  const t = teorico(f);
                  const diff = f.existencia_final_contada !== null ? f.existencia_final_contada - t : null;
                  return (
                    <tr key={item.id} className="border-b border-base-800/60">
                      <td className="py-1.5 pr-3 font-medium text-neutral-200">{item.nombre}</td>
                      {(["existencia_inicial", "entradas", "bajada_almacen", "consumo", "merma", "ajuste"] as const).map(
                        (campo) => (
                          <td key={campo} className="px-2 py-1.5">
                            <input
                              type="number"
                              step="0.25"
                              value={f[campo] as number}
                              onChange={(e) => update(item.id, campo, e.target.value)}
                              className="w-16 rounded-md border border-base-700 bg-base-900 px-1.5 py-1 text-neutral-100 focus:border-chilli"
                            />
                          </td>
                        )
                      )}
                      <td className="px-2 py-1.5 font-mono text-neutral-300">{t.toFixed(2)}</td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.25"
                          value={f.existencia_final_contada ?? ""}
                          onChange={(e) => update(item.id, "existencia_final_contada", e.target.value)}
                          placeholder="—"
                          className="w-16 rounded-md border border-base-700 bg-base-900 px-1.5 py-1 text-neutral-100 focus:border-chilli"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono">
                        {diff === null ? (
                          <span className="text-neutral-600">—</span>
                        ) : diff === 0 ? (
                          <span className="text-ok">0</span>
                        ) : diff < 0 ? (
                          <span className="text-chilli-light">{diff}</span>
                        ) : (
                          <span className="text-warn">+{diff}</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
