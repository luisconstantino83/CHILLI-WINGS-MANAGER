"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import ComparisonBadge from "@/components/ComparisonBadge";
import { Save, ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { Cerveza, InventarioCerveza, VentaCerveza, ComparacionCerveza } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayISO(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

type Fila = {
  bodega: number;
  cuarto_frio: number;
  caja: number;
  barra: number;
};

export default function CervezaPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fecha, setFecha] = useState(todayISO());
  const [cervezas, setCervezas] = useState<Cerveza[]>([]);
  const [filas, setFilas] = useState<Record<string, Fila>>({});
  const [ayerTotales, setAyerTotales] = useState<Record<string, number>>({});
  const [ventas, setVentas] = useState<Record<string, number>>({});
  const [comparaciones, setComparaciones] = useState<ComparacionCerveza[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSavedMsg("");

      const [{ data: cvz }, { data: hoy }, { data: ayer }, { data: vts }, { data: comp }] =
        await Promise.all([
          supabase.from("cervezas").select("*").eq("activo", true).order("orden"),
          supabase.from("inventario_cerveza").select("*").eq("fecha", fecha),
          supabase
            .from("inventario_cerveza")
            .select("cerveza_id,total")
            .eq("fecha", yesterdayISO(fecha)),
          supabase.from("ventas_cerveza").select("*").eq("fecha", fecha),
          supabase.from("v_comparacion_cerveza").select("*").eq("fecha", fecha),
        ]);

      setCervezas(cvz ?? []);

      const filaMap: Record<string, Fila> = {};
      (cvz ?? []).forEach((c) => {
        const existing = (hoy as InventarioCerveza[] | null)?.find((h) => h.cerveza_id === c.id);
        filaMap[c.id] = {
          bodega: existing?.bodega ?? 0,
          cuarto_frio: existing?.cuarto_frio ?? 0,
          caja: existing?.caja ?? 0,
          barra: existing?.barra ?? 0,
        };
      });
      setFilas(filaMap);

      const ayerMap: Record<string, number> = {};
      (ayer ?? []).forEach((a: { cerveza_id: string; total: number }) => {
        ayerMap[a.cerveza_id] = a.total;
      });
      setAyerTotales(ayerMap);

      const ventaMap: Record<string, number> = {};
      (vts as VentaCerveza[] | null)?.forEach((v) => {
        ventaMap[v.cerveza_id] = v.piezas_vendidas;
      });
      setVentas(ventaMap);

      setComparaciones(comp ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, fecha]);

  function updateFila(id: string, campo: keyof Fila, valor: string) {
    const num = valor === "" ? 0 : parseFloat(valor);
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: isNaN(num) ? 0 : num } }));
  }

  function totalFila(f: Fila) {
    return f.bodega + f.cuarto_frio + f.caja + f.barra;
  }

  async function guardarInventario() {
    setSaving(true);
    setSavedMsg("");
    const rows = cervezas.map((c) => ({
      fecha,
      cerveza_id: c.id,
      bodega: filas[c.id]?.bodega ?? 0,
      cuarto_frio: filas[c.id]?.cuarto_frio ?? 0,
      caja: filas[c.id]?.caja ?? 0,
      barra: filas[c.id]?.barra ?? 0,
    }));
    const { error } = await supabase
      .from("inventario_cerveza")
      .upsert(rows, { onConflict: "fecha,cerveza_id" });

    const ventaRows = cervezas
      .filter((c) => ventas[c.id] !== undefined)
      .map((c) => ({ fecha, cerveza_id: c.id, piezas_vendidas: ventas[c.id] ?? 0 }));
    if (ventaRows.length) {
      await supabase.from("ventas_cerveza").upsert(ventaRows, { onConflict: "fecha,cerveza_id" });
    }

    const { data: comp } = await supabase
      .from("v_comparacion_cerveza")
      .select("*")
      .eq("fecha", fecha);
    setComparaciones(comp ?? []);

    setSaving(false);
    setSavedMsg(error ? "Error al guardar." : "Inventario guardado ✓");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Inventario de cerveza</h1>
          <p className="text-sm text-neutral-500">Bodega · Cuarto frío · Refrigerador · Barra</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-200"
          />
          <button
            onClick={guardarInventario}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-lg bg-chilli px-4 py-1.5 text-sm font-medium text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Guardando…" : "Guardar día"}
          </button>
        </div>
      </div>

      {savedMsg && (
        <p className={savedMsg.includes("Error") ? "text-sm text-chilli-light" : "text-sm text-ok"}>
          {savedMsg}
        </p>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-base-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-3">Cerveza</th>
                <th className="px-2 py-2">Bodega</th>
                <th className="px-2 py-2">Cuarto frío</th>
                <th className="px-2 py-2">Refrigerador</th>
                <th className="px-2 py-2">Barra</th>
                <th className="px-2 py-2">Total</th>
                <th className="px-2 py-2">vs. ayer</th>
                <th className="px-2 py-2">Ventas del día</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-neutral-500">
                    Cargando…
                  </td>
                </tr>
              ) : (
                cervezas.map((c) => {
                  const f = filas[c.id] ?? { bodega: 0, cuarto_frio: 0, caja: 0, barra: 0 };
                  const total = totalFila(f);
                  const ayer = ayerTotales[c.id];
                  const delta = ayer !== undefined ? total - ayer : null;

                  return (
                    <tr key={c.id} className="border-b border-base-800/60 hover:bg-base-800/30">
                      <td className="py-1.5 pr-3 font-medium text-neutral-200">{c.nombre}</td>
                      {(["bodega", "cuarto_frio", "caja", "barra"] as const).map((campo) => (
                        <td key={campo} className="px-2 py-1.5">
                          <input
                            type="number"
                            step="0.25"
                            value={f[campo]}
                            onChange={(e) => updateFila(c.id, campo, e.target.value)}
                            className="w-16 rounded-md border border-base-700 bg-base-900 px-2 py-1 text-neutral-100 focus:border-chilli"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1.5 font-mono font-semibold text-white">{total}</td>
                      <td className="px-2 py-1.5">
                        {delta === null ? (
                          <span className="text-neutral-600">—</span>
                        ) : delta === 0 ? (
                          <span className="flex items-center gap-1 text-neutral-500">
                            <Minus size={12} /> igual
                          </span>
                        ) : delta > 0 ? (
                          <span className="flex items-center gap-1 text-ok">
                            <ArrowUp size={12} /> {delta}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-chilli-light">
                            <ArrowDown size={12} /> {Math.abs(delta)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="1"
                          value={ventas[c.id] ?? ""}
                          onChange={(e) =>
                            setVentas((prev) => ({
                              ...prev,
                              [c.id]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                            }))
                          }
                          placeholder="0"
                          className="w-16 rounded-md border border-base-700 bg-base-900 px-2 py-1 text-neutral-100 focus:border-chilli"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-base font-semibold text-white">
          Comparación: esperado vs. contado
        </h2>
        {comparaciones.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Guarda el inventario y las ventas del día para ver la comparación.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-base-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-3">Cerveza</th>
                  <th className="px-2 py-2">Inv. anterior</th>
                  <th className="px-2 py-2">Entradas</th>
                  <th className="px-2 py-2">Ventas</th>
                  <th className="px-2 py-2">Esperado</th>
                  <th className="px-2 py-2">Contado</th>
                  <th className="px-2 py-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {comparaciones.map((c) => (
                  <tr key={c.cerveza_id} className="border-b border-base-800/60">
                    <td className="py-1.5 pr-3 font-medium text-neutral-200">{c.cerveza_nombre}</td>
                    <td className="px-2 py-1.5 text-neutral-400">{c.inventario_anterior}</td>
                    <td className="px-2 py-1.5 text-neutral-400">{c.entradas}</td>
                    <td className="px-2 py-1.5 text-neutral-400">{c.ventas}</td>
                    <td className="px-2 py-1.5 font-mono text-neutral-200">{c.esperado}</td>
                    <td className="px-2 py-1.5 font-mono text-white">{c.contado}</td>
                    <td className="px-2 py-1.5">
                      <ComparisonBadge diferencia={c.diferencia} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
