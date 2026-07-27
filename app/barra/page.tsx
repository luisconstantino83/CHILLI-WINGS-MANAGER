"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Save, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
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

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("otro");
  const [nuevaUnidad, setNuevaUnidad] = useState("pieza");
  const [agregando, setAgregando] = useState(false);

  async function agregarProducto() {
    if (!nuevoNombre.trim()) return;
    setAgregando(true);
    const { data, error } = await supabase
      .from("barra_items")
      .insert({
        nombre: nuevoNombre.trim(),
        categoria: nuevaCategoria,
        unidad: nuevaUnidad,
        orden: items.length + 1,
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [...prev, data]);
      setNuevoNombre("");
    }
    setAgregando(false);
  }

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
          <h1 className="font-display text-2xl font-semibold text-white">Inventario semanal de barra</h1>
          <p className="text-sm text-neutral-500">Licores, jarabes, jugos y fresco — se hace los jueves, admite decimales</p>
          <Link href="/barra/movimientos" className="mt-1 flex items-center gap-1 text-xs text-chilli-light hover:underline">
            Ir a movimientos diarios (entradas, consumo, merma) <ArrowRight size={12} />
          </Link>
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

      <Card>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Agregar producto nuevo
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Nombre del producto"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="min-w-[180px] flex-1 rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
          />
          <select
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            className="rounded-md border border-base-700 bg-base-900 px-2 py-1.5 text-sm text-neutral-100"
          >
            <option value="licor">Licor</option>
            <option value="jarabe">Jarabe</option>
            <option value="jugo">Jugo</option>
            <option value="fruta">Fruta / fresco</option>
            <option value="otro">Otro</option>
          </select>
          <select
            value={nuevaUnidad}
            onChange={(e) => setNuevaUnidad(e.target.value)}
            className="rounded-md border border-base-700 bg-base-900 px-2 py-1.5 text-sm text-neutral-100"
          >
            <option value="pieza">pieza</option>
            <option value="l">litros</option>
            <option value="ml">ml</option>
            <option value="oz">oz</option>
          </select>
          <button
            onClick={agregarProducto}
            disabled={agregando}
            className="flex items-center gap-2 rounded-md bg-chilli px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </Card>
    </div>
  );
}
