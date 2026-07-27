"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, StatCard } from "@/components/Card";
import ComparisonBadge from "@/components/ComparisonBadge";
import { Check, Circle, Clock } from "lucide-react";
import clsx from "clsx";
import type { ActividadCatalogo, ActividadCompletada, ComparacionCerveza } from "@/lib/types";

const FRASES = [
  "Un restaurante ordenado se nota en cada mesa.",
  "Lo que se mide, se controla.",
  "Hoy es un buen día para dejar todo en su lugar.",
  "El detalle de hoy es el ahorro de mañana.",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [now, setNow] = useState(new Date());
  const [actividades, setActividades] = useState<ActividadCatalogo[]>([]);
  const [completadas, setCompletadas] = useState<ActividadCompletada[]>([]);
  const [comparaciones, setComparaciones] = useState<ComparacionCerveza[]>([]);
  const [loading, setLoading] = useState(true);
  const frase = useMemo(() => FRASES[new Date().getDate() % FRASES.length], []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const hoy = todayISO();
      const diaSemana = new Date().getDay();

      const [{ data: cat }, { data: comp }, { data: cmpz }] = await Promise.all([
        supabase.from("actividades_catalogo").select("*").eq("activo", true).order("orden"),
        supabase.from("actividades_completadas").select("*").eq("fecha", hoy),
        supabase.from("v_comparacion_cerveza").select("*").eq("fecha", hoy),
      ]);

      setActividades((cat ?? []).filter((a) => a.dias_semana.includes(diaSemana)));
      setCompletadas(comp ?? []);
      setComparaciones(cmpz ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function toggleActividad(actividadId: string) {
    const hoy = todayISO();
    const existing = completadas.find((c) => c.actividad_id === actividadId);

    if (existing) {
      await supabase.from("actividades_completadas").delete().eq("id", existing.id);
      setCompletadas((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("actividades_completadas")
        .insert({ actividad_id: actividadId, fecha: hoy })
        .select()
        .single();
      if (data) setCompletadas((prev) => [...prev, data]);
    }
  }

  const hechas = completadas.length;
  const totalActividades = actividades.length;
  const progreso = totalActividades ? Math.round((hechas / totalActividades) * 100) : 0;

  const faltantes = comparaciones.filter((c) => c.diferencia < 0);
  const sobrantes = comparaciones.filter((c) => c.diferencia > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-neutral-500 capitalize">
          {now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-semibold text-white">
            Buen turno, Encargado
          </h1>
          <span className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Clock size={14} />
            {now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-sm text-neutral-500 italic">{frase}</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Actividades de hoy"
          value={`${hechas}/${totalActividades}`}
          sub={`${progreso}% completado`}
          tone={progreso === 100 ? "good" : "neutral"}
        />
        <StatCard
          label="Faltantes detectados"
          value={String(faltantes.length)}
          sub="cerveza, hoy"
          tone={faltantes.length > 0 ? "bad" : "good"}
        />
        <StatCard
          label="Sobrantes detectados"
          value={String(sobrantes.length)}
          sub="cerveza, hoy"
          tone={sobrantes.length > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Inventarios contados"
          value={String(comparaciones.length)}
          sub="cerveza, hoy"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Checklist */}
        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">
              Actividades de hoy
            </h2>
            <span className="text-xs text-neutral-500">{progreso}%</span>
          </div>
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-base-800">
            <div
              className="h-full bg-chilli transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : actividades.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay actividades configuradas para hoy.</p>
          ) : (
            <ul className="space-y-1.5">
              {actividades.map((a) => {
                const done = completadas.some((c) => c.actividad_id === a.id);
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => toggleActividad(a.id)}
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
                      {a.nombre}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Alerts */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-display text-base font-semibold text-white">
            Alertas de cerveza
          </h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : comparaciones.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Aún no hay inventario de cerveza contado hoy.
            </p>
          ) : faltantes.length === 0 && sobrantes.length === 0 ? (
            <p className="text-sm text-ok">Todo cuadra perfecto hoy. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {[...faltantes, ...sobrantes].map((c) => (
                <li
                  key={c.cerveza_id}
                  className="flex items-center justify-between rounded-lg bg-base-800/60 px-3 py-2"
                >
                  <span className="text-sm text-neutral-200">{c.cerveza_nombre}</span>
                  <ComparisonBadge diferencia={c.diferencia} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
