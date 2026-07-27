"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Save } from "lucide-react";
import type { BarraItem, BarraInventario } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const CATEGORIA_LABEL: Record<string, string> = {
  licor: "Licores",
  jarabe: "Jarabes",
  jugo: "Jugos",
  fruta: "Frutas / fresco",
  otro: "Otro",
};

export default function BarraPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fecha, setFecha] = useState(todayISO());
  const [items, setItems] = useState<BarraItem[]>([]);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setSavedMsg("");
      const [{ data: its }, { data: inv }] = await Promise.all([
        supabase.from("barra_items").select("*").eq("activo", true).order("orden"),
        supabase.from("barra_inventario").select("*").eq("fecha", fecha),
      ]);
      setItems(its ?? []);
      const map: Record<string, number> = {};
      (inv as BarraInventario[] | null)?.forEach((i) => (map[i.item_id] = i.cantidad));
      setCantidades(map);
      setLoading(false);
    }
    load();
  }, [supabase, fecha]);

  async function guardar() {
    setSaving(true);
    const rows = items.map((i) => ({
      fecha,
      item_id: i.id,
      cantidad: cantidades[i.id] ?? 0,
    }));
    const { error } = await supabase
      .from("barra_inventario")
      .upsert(rows, { onConflict: "fecha,item_id" });
    setSaving(false);
    setSavedMsg(error ? "Error al guardar." : "Inventario de barra guardado ✓");
  }

  const grupos = items.reduce<Record<string, BarraItem[]>>((acc, item) => {
    (acc[item.categoria] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Inventario de barra</h1>
          <p className="text-sm text-neutral-500">Licores, jarabes, jugos y fresco — admite decimales</p>
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
        Object.entries(grupos).map(([categoria, itemsCat]) => (
          <Card key={categoria}>
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-neutral-400">
              {CATEGORIA_LABEL[categoria] ?? categoria}
            </h2>
            <ul className="divide-y divide-base-800">
              {itemsCat.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-neutral-200">{item.nombre}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.25"
                      value={cantidades[item.id] ?? 0}
                      onChange={(e) =>
                        setCantidades((prev) => ({
                          ...prev,
                          [item.id]: e.target.value === "" ? 0 : parseFloat(e.target.value),
                        }))
                      }
                      className="w-20 rounded-md border border-base-700 bg-base-900 px-2 py-1 text-right text-neutral-100 focus:border-chilli"
                    />
                    <span className="w-8 text-xs text-neutral-500">{item.unidad}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </div>
  );
}
