"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, StatCard } from "@/components/Card";
import ComparisonBadge from "@/components/ComparisonBadge";
import { Check, Circle, Clock, ArrowDown, ArrowUp, CalendarCheck, AlertTriangle, Boxes } from "lucide-react";
import clsx from "clsx";
import type {
  ActividadCatalogo,
  ActividadCompletada,
  ComparacionCerveza,
  Reservacion,
  PostreItem,
  Empleado,
  ChecklistItem,
  ChecklistCompletado,
  MaterialProximoInventario,
  UltimoInventarioCerveza,
  UltimoInventarioBarraSemanal,
} from "@/lib/types";

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
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [postresBajos, setPostresBajos] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [personal, setPersonal] = useState<Empleado[]>([]);
  const [checklistPendientes, setChecklistPendientes] = useState(0);
  const [checklistTotal, setChecklistTotal] = useState(0);
  const [materialProximo, setMaterialProximo] = useState<MaterialProximoInventario | null>(null);
  const [ultimaCerveza, setUltimaCerveza] = useState<UltimoInventarioCerveza | null>(null);
  const [ultimaBarra, setUltimaBarra] = useState<UltimoInventarioBarraSemanal | null>(null);
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

      const [
        { data: cat },
        { data: comp },
        { data: cmpz },
        { data: reservas },
        { data: postres },
        { data: postresInv },
        { data: empleados },
        ,
        { data: checklistItems },
        { data: checklistComp },
        { data: matProximo },
        { data: cervezaUltima },
        { data: barraUltima },
      ] = await Promise.all([
        supabase.from("actividades_catalogo").select("*").eq("activo", true).order("orden"),
        supabase.from("actividades_completadas").select("*").eq("fecha", hoy),
        supabase.from("v_comparacion_cerveza").select("*").eq("fecha", hoy),
        supabase.from("reservaciones").select("*").eq("fecha", hoy).order("hora"),
        supabase.from("postres_items").select("*").eq("activo", true),
        supabase.from("postres_inventario").select("item_id,cantidad").eq("fecha", hoy),
        supabase.from("empleados").select("*").eq("activo", true).order("nombre"),
        supabase.from("checklist_tipos").select("*"),
        supabase.from("checklist_items").select("*").eq("activo", true),
        supabase.from("checklist_completados").select("*").eq("fecha", hoy),
        supabase.from("v_material_proximo_inventario").select("*").maybeSingle(),
        supabase.from("v_ultimo_inventario_cerveza").select("*").maybeSingle(),
        supabase.from("v_ultimo_inventario_barra_semanal").select("*").maybeSingle(),
      ]);

      setActividades((cat ?? []).filter((a) => a.dias_semana.includes(diaSemana)));
      setCompletadas(comp ?? []);
      setComparaciones(cmpz ?? []);
      setReservaciones(reservas ?? []);
      setPersonal(empleados ?? []);
      setMaterialProximo(matProximo ?? null);
      setUltimaCerveza(cervezaUltima ?? null);
      setUltimaBarra(barraUltima ?? null);

      const totalItems = (checklistItems as ChecklistItem[] | null)?.length ?? 0;
      const hechosItems = (checklistComp as ChecklistCompletado[] | null)?.length ?? 0;
      setChecklistTotal(totalItems);
      setChecklistPendientes(Math.max(totalItems - hechosItems, 0));

      const invMap: Record<string, number> = {};
      (postresInv as { item_id: string; cantidad: number }[] | null)?.forEach(
        (i) => (invMap[i.item_id] = i.cantidad)
      );
      const bajos = ((postres as PostreItem[]) ?? [])
        .filter((p) => (invMap[p.id] ?? 0) <= p.umbral_alerta)
        .map((p) => ({ nombre: p.nombre, cantidad: invMap[p.id] ?? 0 }));
      setPostresBajos(bajos);

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

      {/* Recordatorios y resúmenes rápidos */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Personal activo"
          value={String(personal.length)}
          sub={personal.slice(0, 2).map((p) => p.nombre).join(", ") || "sin empleados"}
        />
        <StatCard
          label="Checklists pendientes"
          value={`${checklistPendientes}/${checklistTotal}`}
          tone={checklistPendientes === 0 && checklistTotal > 0 ? "good" : "neutral"}
        />
        <StatCard
          label="Último inventario cerveza"
          value={ultimaCerveza ? ultimaCerveza.fecha : "—"}
          sub={ultimaCerveza ? `${ultimaCerveza.cervezas_contadas} productos` : "sin registros"}
        />
        <StatCard
          label="Últ. inventario barra semanal"
          value={ultimaBarra ? ultimaBarra.fecha : "—"}
          sub={ultimaBarra ? `${ultimaBarra.productos_contados} productos` : "sin registros"}
        />
      </div>

      {materialProximo?.alerta_activa && (
        <Card className="border-warn/40">
          <div className="flex items-center gap-2 text-sm text-warn">
            <Boxes size={16} />
            <span className="font-medium">Se acerca el inventario mensual de material</span>
            <span className="text-neutral-400">
              — próximo: {materialProximo.proximo_inventario}
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reservations today */}
        <Card>
          <h2 className="mb-4 font-display text-base font-semibold text-white">
            Reservaciones de hoy
          </h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : reservaciones.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay reservaciones registradas para hoy.</p>
          ) : (
            <ul className="space-y-2">
              {reservaciones.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-lg bg-base-800/60 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-neutral-200">
                    <CalendarCheck size={14} className="text-neutral-500" />
                    {r.hora.slice(0, 5)} · {r.cliente_nombre}
                  </span>
                  <span className="text-xs text-neutral-500">{r.personas}p · Área {r.area}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Low stock desserts */}
        <Card>
          <h2 className="mb-4 font-display text-base font-semibold text-white">
            Postres por agotarse
          </h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : postresBajos.length === 0 ? (
            <p className="text-sm text-ok">Niveles de postres bien surtidos.</p>
          ) : (
            <ul className="space-y-2">
              {postresBajos.map((p) => (
                <li key={p.nombre} className="flex items-center justify-between rounded-lg bg-chilli/10 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-neutral-200">
                    <AlertTriangle size={14} className="text-chilli-light" />
                    {p.nombre}
                  </span>
                  <span className="text-xs text-chilli-light">{p.cantidad} pzas</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
