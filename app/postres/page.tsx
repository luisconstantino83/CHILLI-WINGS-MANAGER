"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Save, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import type { PostreItem, PostreInventario } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PostresPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fecha, setFecha] = useState(todayISO());
  const [items, setItems] = useState<PostreItem[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [ayer, setAyer] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSavedMsg("");
      const ayerFecha = new Date(fecha + "T00:00:00");
      ayerFecha.setDate(ayerFecha.getDate() - 1);

      const [{ data: its }, { data: inv }, { data: invAyer }] = await Promise.all([
        supabase.from("postres_items").select("*").eq("activo", true).order("orden"),
        supabase.from("postres_inventario").select("*").eq("fecha", fecha),
        supabase
          .from("postres_inventario")
          .select("*")
          .eq("fecha", ayerFecha.toISOString().slice(0, 10)),
      ]);
      setItems(its ?? []);
      const map: Record<string, number> = {};
      (inv as PostreInventario[] | null)?.forEach((i) => (map[i.item_id] = i.cantidad));
      setCantidades(map);
      const mapAyer: Record<string, number> = {};
      (invAyer as PostreInventario[] | null)?.forEach((i) => (mapAyer[i.item_id] = i.cantidad));
      setAyer(mapAyer);
      setLoading(false);
    }
    load();
  }, [supabase, fecha]);

  async function guardar() {
    setSaving(true);
    const rows = items.map((i) => ({ fecha, item_id: i.id, cantidad: cantidades[i.id] ?? 0 }));
    const { error } = await supabase
      .from("postres_inventario")
      .upsert(rows, { onConflict: "fecha,item_id" });
    setSaving(false);
    setSavedMsg(error ? "Error al guardar." : "Inventario de postres guardado ✓");
  }

  const bajos = items.filter((i) => (cantidades[i.id] ?? 0) <= i.umbral_alerta);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Inventario de postres</h1>
          <p className="text-sm text-neutral-500">Piezas restantes por sabor</p>
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

      {bajos.length > 0 && (
        <Card className="border-chilli/40">
          <div className="flex items-center gap-2 text-sm text-chilli-light">
            <AlertTriangle size={16} />
            <span className="font-medium">Por agotarse:</span>
            <span className="text-neutral-300">{bajos.map((b) => b.nombre).join(", ")}</span>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <p className="text-sm text-neutral-500">Cargando…</p>
        ) : (
          <ul className="divide-y divide-base-800">
            {items.map((item) => {
              const cantidad = cantidades[item.id] ?? 0;
              const bajo = cantidad <= item.umbral_alerta;
              const ayerCant = ayer[item.id];
              return (
                <li key={item.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-200">{item.nombre}</span>
                    {bajo && (
                      <span className="rounded-full bg-chilli/15 px-2 py-0.5 text-[10px] font-medium text-chilli-light">
                        pocas piezas
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {ayerCant !== undefined && (
                      <span className="text-xs text-neutral-600">ayer: {ayerCant}</span>
                    )}
                    <input
                      type="number"
                      step="1"
                      value={cantidad}
                      onChange={(e) =>
                        setCantidades((prev) => ({
                          ...prev,
                          [item.id]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                        }))
                      }
                      className={clsx(
                        "w-16 rounded-md border bg-base-900 px-2 py-1 text-right text-neutral-100 focus:border-chilli",
                        bajo ? "border-chilli/50" : "border-base-700"
                      )}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
