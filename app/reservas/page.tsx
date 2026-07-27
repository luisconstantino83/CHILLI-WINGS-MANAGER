"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Plus, Trash2, Phone, Users, MapPin } from "lucide-react";
import clsx from "clsx";
import type { Reservacion } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const ESTATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  presente: "Cliente presente",
  no_presento: "No se presentó",
  cancelada: "Cancelada",
};
const ESTATUS_COLOR: Record<string, string> = {
  pendiente: "bg-warn/15 text-warn",
  confirmada: "bg-ok/15 text-ok",
  presente: "bg-ok/25 text-ok",
  no_presento: "bg-chilli/15 text-chilli-light",
  cancelada: "bg-base-800 text-neutral-500",
};

const AREAS = ["A", "B", "C", "Terraza"];

const initialForm = {
  cliente_nombre: "",
  telefono: "",
  fecha: todayISO(),
  hora: "19:00",
  personas: 2,
  area: "A",
  mesa: "",
  motivo: "",
  notas: "",
};

export default function ReservasPage() {
  const supabase = useMemo(() => createClient(), []);
  const [fecha, setFecha] = useState(todayISO());
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  async function cargar() {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("reservaciones")
      .select("*")
      .eq("fecha", fecha)
      .order("hora");
    if (err) setError(err.message);
    setReservaciones(data ?? []);
    setLoading(false);
  }

  async function crear() {
    if (!form.cliente_nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    setGuardando(true);
    setError("");
    const { data, error: err } = await supabase
      .from("reservaciones")
      .insert({
        cliente_nombre: form.cliente_nombre.trim(),
        telefono: form.telefono || null,
        fecha: form.fecha,
        hora: form.hora,
        personas: form.personas,
        area: form.area,
        mesa: form.mesa || null,
        motivo: form.motivo || null,
        notas: form.notas || null,
        estatus: "pendiente",
      })
      .select()
      .single();
    setGuardando(false);
    if (err) {
      setError(`No se pudo guardar: ${err.message}`);
      return;
    }
    if (data) {
      if (data.fecha === fecha) setReservaciones((prev) => [...prev, data].sort((a, b) => a.hora.localeCompare(b.hora)));
      setForm({ ...initialForm, fecha });
      setMostrarForm(false);
    }
  }

  async function cambiarEstatus(id: string, estatus: string) {
    const { data, error: err } = await supabase
      .from("reservaciones")
      .update({ estatus })
      .eq("id", id)
      .select()
      .single();
    if (!err && data) {
      setReservaciones((prev) => prev.map((r) => (r.id === id ? data : r)));
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta reservación? Esta acción no se puede deshacer.")) return;
    const { error: err } = await supabase.from("reservaciones").delete().eq("id", id);
    if (!err) setReservaciones((prev) => prev.filter((r) => r.id !== id));
  }

  const filtradas = reservaciones.filter((r) =>
    r.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Reservaciones</h1>
          <p className="text-sm text-neutral-500">Áreas A · B · C · Terraza</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-200"
          />
          <button
            onClick={() => {
              setForm({ ...initialForm, fecha });
              setMostrarForm((v) => !v);
            }}
            className="flex items-center gap-2 rounded-lg bg-chilli px-4 py-1.5 text-sm font-medium text-white shadow-glow hover:opacity-90"
          >
            <Plus size={15} /> Nueva reservación
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-chilli-light">{error}</p>}

      {mostrarForm && (
        <Card>
          <h2 className="mb-3 font-display text-sm font-semibold text-white">Nueva reservación</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Nombre del cliente *"
              value={form.cliente_nombre}
              onChange={(e) => setForm((f) => ({ ...f, cliente_nombre: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              type="time"
              value={form.hora}
              onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              type="number"
              min={1}
              placeholder="Personas"
              value={form.personas}
              onChange={(e) => setForm((f) => ({ ...f, personas: parseInt(e.target.value) || 1 }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <select
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100"
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>Área {a}</option>
              ))}
            </select>
            <input
              placeholder="Mesa (opcional)"
              value={form.mesa}
              onChange={(e) => setForm((f) => ({ ...f, mesa: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <input
              placeholder="Motivo / evento (opcional)"
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli"
            />
            <textarea
              placeholder="Observaciones"
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-neutral-100 focus:border-chilli sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={crear}
              disabled={guardando}
              className="rounded-md bg-chilli px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar reservación"}
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              className="rounded-md border border-base-700 px-4 py-1.5 text-sm text-neutral-400 hover:bg-base-800"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}

      <input
        placeholder="Buscar por nombre de cliente…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full rounded-lg border border-base-700 bg-base-900 px-3 py-2 text-sm text-neutral-100 focus:border-chilli"
      />

      {loading ? (
        <Card><p className="text-sm text-neutral-500">Cargando…</p></Card>
      ) : filtradas.length === 0 ? (
        <Card>
          <p className="text-sm text-neutral-500">
            Aún no hay reservaciones para este día. Agrega la primera con el botón de arriba.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-semibold text-white">{r.hora.slice(0, 5)}</span>
                    <span className="text-sm text-neutral-200">{r.cliente_nombre}</span>
                    <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-medium", ESTATUS_COLOR[r.estatus])}>
                      {ESTATUS_LABEL[r.estatus]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {r.personas}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> Área {r.area}{r.mesa ? ` · Mesa ${r.mesa}` : ""}</span>
                    {r.telefono && <span className="flex items-center gap-1"><Phone size={12} /> {r.telefono}</span>}
                  </div>
                  {r.motivo && <p className="mt-1 text-xs text-neutral-500">Motivo: {r.motivo}</p>}
                  {r.notas && <p className="mt-1 text-xs text-neutral-600">{r.notas}</p>}
                </div>
                <button onClick={() => eliminar(r.id)} className="text-neutral-600 hover:text-chilli-light">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["pendiente", "confirmada", "presente", "no_presento", "cancelada"] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => cambiarEstatus(r.id, e)}
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      r.estatus === e ? ESTATUS_COLOR[e] : "bg-base-800 text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    {ESTATUS_LABEL[e]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
