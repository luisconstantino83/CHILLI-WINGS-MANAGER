"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Check, Circle } from "lucide-react";
import clsx from "clsx";
import type { ChecklistTipo, ChecklistItem, ChecklistCompletado } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ChecklistsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [tipos, setTipos] = useState<ChecklistTipo[]>([]);
  const [tipoActivo, setTipoActivo] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completados, setCompletados] = useState<ChecklistCompletado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const hoy = todayISO();
      const [{ data: tps }, { data: its }, { data: comp }] = await Promise.all([
        supabase.from("checklist_tipos").select("*").order("orden"),
        supabase.from("checklist_items").select("*").eq("activo", true).order("orden"),
        supabase.from("checklist_completados").select("*").eq("fecha", hoy),
      ]);
      setTipos(tps ?? []);
      setItems(its ?? []);
      setCompletados(comp ?? []);
      if ((tps ?? []).length && !tipoActivo) setTipoActivo(tps![0].id);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function toggle(itemId: string) {
    const hoy = todayISO();
    const existing = completados.find((c) => c.item_id === itemId);
    if (existing) {
      await supabase.from("checklist_completados").delete().eq("id", existing.id);
      setCompletados((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("checklist_completados")
        .insert({ item_id: itemId, fecha: hoy })
        .select()
        .single();
      if (data) setCompletados((prev) => [...prev, data]);
    }
  }

  const itemsTipo = items.filter((i) => i.tipo_id === tipoActivo);
  const hechos = itemsTipo.filter((i) => completados.some((c) => c.item_id === i.id)).length;
  const progreso = itemsTipo.length ? Math.round((hechos / itemsTipo.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Checklists</h1>
        <p className="text-sm text-neutral-500">Apertura · Durante el turno · Cierre</p>
      </div>

      <div className="flex gap-2">
        {tipos.map((t) => (
          <button
            key={t.id}
            onClick={() => setTipoActivo(t.id)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              tipoActivo === t.id ? "bg-chilli text-white shadow-glow" : "bg-base-800 text-neutral-400"
            )}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">
            {tipos.find((t) => t.id === tipoActivo)?.nombre ?? ""}
          </h2>
          <span className="text-xs text-neutral-500">{progreso}%</span>
        </div>
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-base-800">
          <div className="h-full bg-chilli transition-all duration-500" style={{ width: `${progreso}%` }} />
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Cargando…</p>
        ) : itemsTipo.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay actividades en este checklist todavía.</p>
        ) : (
          <ul className="space-y-1.5">
            {itemsTipo.map((item) => {
              const done = completados.some((c) => c.item_id === item.id);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggle(item.id)}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      done
                        ? "bg-ok/10 text-neutral-400 line-through decoration-neutral-600"
                        : "bg-base-800/60 text-neutral-200 hover:bg-base-800"
                    )}
                  >
                    {done ? (
                      <Check size={16} className="shrink-0 text-ok" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-neutral-600" />
                    )}
                    {item.nombre}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
