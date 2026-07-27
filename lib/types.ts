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
  piezas_vendidas: number;
};

export type ComparacionCerveza = {
  fecha: string;
  cerveza_id: string;
  cerveza_nombre: string;
  inventario_anterior: number;
  entradas: number;
  ventas: number;
  esperado: number;
  contado: number;
  diferencia: number;
};

export type ActividadCatalogo = {
  id: string;
  nombre: string;
  dias_semana: number[];
  activo: boolean;
  orden: number;
};

export type ActividadCompletada = {
  id: string;
  actividad_id: string;
  fecha: string;
  hora: string;
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
