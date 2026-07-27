"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Save, ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { MaterialCategoria, MaterialItem, MaterialInventario, MaterialMensual } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function MaterialPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fecha, setFecha] = useState(todayISO());
  const [categorias, setCategorias] = useState<MaterialCategoria[]>([]);
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [mensual, setMensual] = useState<MaterialMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSavedMsg("");
      const [{ data: cats }, { data: its }, { data: inv }, { data: mens }] = await Promise.all([
        supabase.from("material_categorias").select("*").order("orden"),
        supabase.from("material_items").select("*").eq("activo", true).order("orden"),
        supabase.from("material_inventario").select("*").eq("fecha", fecha),
        supabase.from("v_material_mensual").select("*"),
      ]);
      setCategorias(cats ?? []);
      setItems(its ?? []);
      const map: Record<string, number> = {};
      (inv as MaterialInventario[] | null)?.forEach((i) => (map[i.item_id] = i.cantidad));
      setCantidades(map);
      setMensual(mens ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, fecha]);

  async function guardar() {
    setSaving(true);
    const rows = items.map((i) => ({ fecha, item_id: i.id, cantidad: cantidades[i.id] ?? 0 }));
    const { error } = await supabase
      .from("material_inventario")
      .upsert(rows, { onConflict: "fecha,item_id" });
    const { data: mens } = await supabase.from("v_material_mensual").select("*");
    setMensual(mens ?? []);
    setSaving(false);
    setSavedMsg(error ? "Error al guardar." : "Inventario de material guardado ✓");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Inventario de material</h1>
          <p className="text-sm text-neutral-500">Platos · Tarros · Vasos · Jarras · Tequileros · Cristalería · Cubiertos</p>
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

      {savedMsg && (
        <p className={savedMsg.includes("Error") ? "text-sm text-chilli-light" : "text-sm text-ok"}>{savedMsg}</p>
      )}

      {loading ? (
        <Card><p className="text-sm text-neutral-500">Cargando…</p></Card>
      ) : (
        categorias.map((cat) => {
          const itemsCat = items.filter((i) => i.categoria_id === cat.id);
          if (itemsCat.length === 0) return null;
          return (
            <Card key={cat.id}>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-neutral-400">
                {cat.nombre}
              </h2>
              <ul className="divide-y divide-base-800">
                {itemsCat.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-200">{item.nombre}</span>
                    <input
                      type="number"
                      step="1"
                      value={cantidades[item.id] ?? 0}
                      onChange={(e) =>
                        setCantidades((prev) => ({
                          ...prev,
                          [item.id]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                        }))
                      }
                      className="w-20 rounded-md border border-base-700 bg-base-900 px-2 py-1 text-right text-neutral-100 focus:border-chilli"
                    />
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}

      <Card>
        <h2 className="mb-4 font-display text-base font-semibold text-white">Comparación mensual</h2>
        {mensual.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Aún no hay suficiente historial (se necesita al menos 2 meses de inventario).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-base-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2 pr-3">Artículo</th>
                  <th className="px-2 py-2">Categoría</th>
                  <th className="px-2 py-2">Mes anterior</th>
                  <th className="px-2 py-2">Este mes</th>
                  <th className="px-2 py-2">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {mensual.map((m) => (
                  <tr key={m.item_id} className="border-b border-base-800/60">
                    <td className="py-1.5 pr-3 font-medium text-neutral-200">{m.item_nombre}</td>
                    <td className="px-2 py-1.5 text-neutral-500">{m.categoria_nombre}</td>
                    <td className="px-2 py-1.5 text-neutral-400">{m.cantidad_mes_anterior ?? "—"}</td>
                    <td className="px-2 py-1.5 font-mono text-white">{m.cantidad_actual}</td>
                    <td className="px-2 py-1.5">
                      {m.diferencia === 0 ? (
                        <span className="flex items-center gap-1 text-neutral-500"><Minus size={12} /> igual</span>
                      ) : m.diferencia > 0 ? (
                        <span className="flex items-center gap-1 text-ok"><ArrowUp size={12} /> +{m.diferencia}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-chilli-light"><ArrowDown size={12} /> {m.diferencia}</span>
                      )}
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
