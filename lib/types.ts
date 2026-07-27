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
