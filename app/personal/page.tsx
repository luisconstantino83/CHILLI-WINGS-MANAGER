"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Plus, User } from "lucide-react";
import clsx from "clsx";
import type { Empleado, EmpleadoNota } from "@/lib/types";

const TIPO_LABEL: Record<string, string> = {
  observacion: "Observación",
  capacitacion: "Capacitación",
  llamada_atencion: "Llamada de atención",
};
const TIPO_COLOR: Record<string, string> = {
  observacion: "text-neutral-400",
  capacitacion: "text-ok",
  llamada_atencion: "text-chilli-light",
};

export default function PersonalPage() {
  const supabase = useMemo(() => createClient(), []);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [notas, setNotas] = useState<EmpleadoNota[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [area, setArea] = useState("");
  const [horario, setHorario] = useState("");

  const [notaTexto, setNotaTexto] = useState("");
  const [notaTipo, setNotaTipo] = useState<"observacion" | "capacitacion" | "llamada_atencion">("observacion");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: emp }, { data: nts }] = await Promise.all([
        supabase.from("empleados").select("*").eq("activo", true).order("nombre"),
        supabase.from("empleados_notas").select("*").order("fecha", { ascending: false }),
      ]);
      setEmpleados(emp ?? []);
      setNotas(nts ?? []);
      if ((emp ?? []).length && !seleccionado) setSeleccionado(emp![0].id);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function agregarEmpleado() {
    if (!nombre.trim()) return;
    const { data } = await supabase
      .from("empleados")
      .insert({ nombre, area, horario })
      .select()
      .single();
    if (data) {
      setEmpleados((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNombre("");
      setArea("");
      setHorario("");
    }
  }

  async function agregarNota() {
    if (!seleccionado || !notaTexto.trim()) return;
    const { data } = await supabase
      .from("empleados_notas")
      .insert({ empleado_id: seleccionado, tipo: notaTipo, nota: notaTexto })
      .select()
      .single();
    if (data) {
      setNotas((prev) => [data, ...prev]);
      setNotaTexto("");
    }
  }

  const notasEmpleado = notas.filter((n) => n.empleado_id === seleccionado);
  const empleadoActual = empleados.find((e) => e.id === seleccionado);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white">Personal</h1>
        <p className="text-sm text-neutral-500">Empleados, áreas, horarios y observaciones</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Employee list + add form */}
        <Card className="md:col-span-1">
          <h2 className="mb-3 font-display text-sm font-semibold text-white">Empleados</h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : (
            <ul className="mb-4 space-y-1">
              {empleados.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setSeleccionado(e.id)}
                    className={clsx(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
                      seleccionado === e.id ? "bg-chilli/15 text-white" : "text-neutral-400 hover:bg-base-800"
                    )}
                  >
                    <User size={14} />
                    <span>{e.nombre}</span>
                    {e.area && <span className="ml-auto text-xs text-neutral-600">{e.area}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-base-800 pt-4">
            <input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-2 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              placeholder="Área (ej. Barra, Cocina)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-2 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              placeholder="Horario (ej. Mar-Dom 4pm-12am)"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              className="w-full rounded-md border border-base-700 bg-base-900 px-2 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <button
              onClick={agregarEmpleado}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-chilli px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus size={14} /> Agregar empleado
            </button>
          </div>
        </Card>

        {/* Notes */}
        <Card className="md:col-span-2">
          {empleadoActual ? (
            <>
              <h2 className="mb-1 font-display text-base font-semibold text-white">{empleadoActual.nombre}</h2>
              <p className="mb-4 text-xs text-neutral-500">
                {empleadoActual.area ?? "Sin área"} · {empleadoActual.horario ?? "Sin horario definido"}
              </p>

              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  {(["observacion", "capacitacion", "llamada_atencion"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNotaTipo(t)}
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs",
                        notaTipo === t ? "bg-chilli/20 text-chilli-light" : "bg-base-800 text-neutral-500"
                      )}
                    >
                      {TIPO_LABEL[t]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="Escribe una nota…"
                    value={notaTexto}
                    onChange={(e) => setNotaTexto(e.target.value)}
                    className="flex-1 rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
                  />
                  <button
                    onClick={agregarNota}
                    className="rounded-md bg-chilli px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <ul className="space-y-2">
                {notasEmpleado.length === 0 ? (
                  <p className="text-sm text-neutral-500">Sin notas todavía.</p>
                ) : (
                  notasEmpleado.map((n) => (
                    <li key={n.id} className="rounded-lg bg-base-800/60 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className={clsx("text-xs font-medium", TIPO_COLOR[n.tipo])}>
                          {TIPO_LABEL[n.tipo]}
                        </span>
                        <span className="text-xs text-neutral-600">{n.fecha}</span>
                      </div>
                      <p className="mt-1 text-sm text-neutral-300">{n.nota}</p>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <p className="text-sm text-neutral-500">Agrega un empleado para empezar.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
