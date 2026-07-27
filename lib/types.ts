export type Cerveza = {
  id: string;
  nombre: string;
  formato: "botella" | "litro" | "caguama";
  orden: number;
  activo: boolean;
};

export type InventarioCerveza = {
  id: string;
  fecha: string;
  cerveza_id: string;
  bodega: number;
  cuarto_frio: number;
  caja: number;
  barra: number;
  total: number;
};

export type VentaCerveza = {
  id: string;
  fecha: string;
  cerveza_id: string;
  venta_sistema: number;
  cortesias: number;
  merma: number;
  ajuste: number;
};

export type ComparacionCerveza = {
  fecha: string;
  cerveza_id: string;
  cerveza_nombre: string;
  inventario_anterior: number;
  venta_sistema: number;
  cortesias: number;
  merma: number;
  ajuste: number;
  esperado: number;
  contado: number;
  diferencia: number;
};

export type ActividadCatalogo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  area: string | null;
  hora_sugerida: string | null;
  prioridad: "baja" | "normal" | "alta";
  dias_semana: number[];
  activo: boolean;
  orden: number;
};

export type ActividadCompletada = {
  id: string;
  actividad_id: string;
  fecha: string;
  hora: string;
  observaciones: string | null;
};

// ---------- Fase 2 ----------

export type BarraItem = {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  orden: number;
  activo: boolean;
};

export type BarraInventario = {
  id: string;
  fecha: string;
  item_id: string;
  cantidad: number;
};

export type PostreItem = {
  id: string;
  nombre: string;
  umbral_alerta: number;
  orden: number;
  activo: boolean;
};

export type PostreInventario = {
  id: string;
  fecha: string;
  item_id: string;
  cantidad: number;
};

export type MaterialCategoria = {
  id: string;
  nombre: string;
  orden: number;
};

export type MaterialItem = {
  id: string;
  categoria_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
};

export type MaterialInventario = {
  id: string;
  fecha: string;
  item_id: string;
  cantidad: number;
};

export type MaterialMensual = {
  item_id: string;
  item_nombre: string;
  categoria_nombre: string;
  mes_actual: string;
  cantidad_actual: number;
  cantidad_mes_anterior: number | null;
  diferencia: number;
  porcentaje_diferencia: number;
  estado: "sin_historial" | "sin_cambio" | "perdida" | "aumento" | "requiere_revision";
};

export type Empleado = {
  id: string;
  nombre: string;
  area: string | null;
  horario: string | null;
  activo: boolean;
};

export type EmpleadoNota = {
  id: string;
  empleado_id: string;
  fecha: string;
  tipo: "observacion" | "capacitacion" | "llamada_atencion";
  nota: string;
};

export type ChecklistTipo = {
  id: string;
  nombre: string;
  orden: number;
};

export type ChecklistItem = {
  id: string;
  tipo_id: string;
  nombre: string;
  orden: number;
  activo: boolean;
};

export type ChecklistCompletado = {
  id: string;
  item_id: string;
  fecha: string;
  hora: string;
};

// ---------- Fase 3 ----------

export type Reservacion = {
  id: string;
  cliente_nombre: string;
  telefono: string | null;
  fecha: string;
  hora: string;
  personas: number;
  area: string;
  mesa: string | null;
  motivo: string | null;
  notas: string | null;
  estatus: "pendiente" | "confirmada" | "presente" | "no_presento" | "cancelada";
  registrado_por: string | null;
};

export type MovimientoBarraDiario = {
  id: string;
  fecha: string;
  item_id: string;
  existencia_inicial: number;
  entradas: number;
  bajada_almacen: number;
  consumo: number;
  merma: number;
  ajuste: number;
  existencia_final_contada: number | null;
  existencia_teorica: number;
  responsable: string | null;
  observaciones: string | null;
};

export type MaterialProximoInventario = {
  ultimo_inventario: string | null;
  proximo_inventario: string | null;
  alerta_activa: boolean;
};

export type UltimoInventarioCerveza = {
  fecha: string;
  cervezas_contadas: number;
  total_piezas: number;
};

export type UltimoInventarioBarraSemanal = {
  fecha: string;
  productos_contados: number;
};
