-- ============================================================
-- CHILLI WINGS MANAGER PRO — Fase 2
-- Barra · Postres · Material · Personal · Checklists
-- Corre esto DESPUÉS de supabase/schema.sql
-- ============================================================

-- ---------- BARRA ----------
create table if not exists barra_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  categoria text not null default 'otro', -- licor | jarabe | jugo | fruta | otro
  unidad text not null default 'pieza',   -- ml | l | oz | pieza
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists barra_inventario (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  item_id uuid not null references barra_items(id) on delete restrict,
  cantidad numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (fecha, item_id)
);

insert into barra_items (nombre, categoria, unidad, orden) values
  ('Bacardí', 'licor', 'pieza', 1),
  ('Bolsa de cacahuates', 'otro', 'pieza', 2),
  ('Bolsa de mango', 'otro', 'pieza', 3),
  ('Calahua', 'otro', 'pieza', 4),
  ('Cereza', 'otro', 'pieza', 5),
  ('Chamoy', 'jarabe', 'l', 6),
  ('Clamato', 'jugo', 'l', 7),
  ('Clavel', 'otro', 'pieza', 8),
  ('Concentrado de limon', 'jugo', 'l', 9),
  ('Controy', 'jarabe', 'pieza', 10),
  ('Don Julio 70', 'licor', 'pieza', 11),
  ('Endulzante', 'jarabe', 'l', 12),
  ('Granadina', 'jarabe', 'l', 13),
  ('Jugo de naranja', 'jugo', 'l', 14),
  ('Jugo de piña', 'jugo', 'l', 15),
  ('Jugo de Uva', 'jugo', 'l', 16),
  ('Margarita Mix', 'jarabe', 'l', 17),
  ('Margarita Mix de tamarindo', 'jarabe', 'l', 18),
  ('Pulpa de fresa', 'fruta', 'l', 19),
  ('Pulpa de mango', 'fruta', 'l', 20),
  ('Pulpa de tamarindo', 'fruta', 'l', 21),
  ('Sal', 'otro', 'pieza', 22),
  ('Salsa de soya', 'otro', 'pieza', 23),
  ('Salsa inglesa', 'otro', 'pieza', 24),
  ('Salsa Maggie', 'otro', 'pieza', 25),
  ('Salsa Tabasco', 'otro', 'pieza', 26),
  ('Tajín', 'otro', 'pieza', 27),
  ('Tarugos', 'otro', 'pieza', 28),
  ('Tequila', 'licor', 'pieza', 29),
  ('Tequila Maestro Dobel', 'licor', 'pieza', 30),
  ('Tequila tradicional', 'licor', 'pieza', 31),
  ('Vodka', 'licor', 'pieza', 32),
  ('Whisky', 'licor', 'pieza', 33)
on conflict (nombre) do nothing;

-- ---------- POSTRES ----------
create table if not exists postres_items (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  umbral_alerta numeric(10,2) not null default 3,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists postres_inventario (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  item_id uuid not null references postres_items(id) on delete restrict,
  cantidad numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (fecha, item_id)
);

insert into postres_items (nombre, orden) values
  ('Mango Mousse', 1), ('Fresa Mousse', 2), ('Oreo', 3), ('Tortuga', 4),
  ('Mazapán', 5), ('Nutella', 6), ('Pastel Zanahoria', 7),
  ('Pastel Mango', 8), ('Flan', 9)
on conflict (nombre) do nothing;

-- ---------- MATERIAL ----------
create table if not exists material_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

create table if not exists material_items (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references material_categorias(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists material_inventario (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  item_id uuid not null references material_items(id) on delete restrict,
  cantidad numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (fecha, item_id)
);

insert into material_categorias (nombre, orden) values
  ('Platos', 1), ('Tarros', 2), ('Vasos', 3), ('Jarras', 4),
  ('Tequileros', 5), ('Cristalería', 6), ('Cubiertos', 7)
on conflict (nombre) do nothing;

-- ---------- PERSONAL ----------
create table if not exists empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  area text,
  horario text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists empleados_notas (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null default 'observacion', -- observacion | capacitacion | llamada_atencion
  nota text not null,
  created_at timestamptz not null default now()
);

-- ---------- CHECKLISTS (apertura / turno / cierre) ----------
create table if not exists checklist_tipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique, -- 'Apertura' | 'Durante el turno' | 'Cierre'
  orden int not null default 0
);

create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  tipo_id uuid not null references checklist_tipos(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists checklist_completados (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references checklist_items(id) on delete cascade,
  fecha date not null,
  hora timestamptz not null default now(),
  unique (item_id, fecha)
);

insert into checklist_tipos (nombre, orden) values
  ('Apertura', 1), ('Durante el turno', 2), ('Cierre', 3)
on conflict (nombre) do nothing;

insert into checklist_items (tipo_id, nombre, orden)
select t.id, i.nombre, i.orden from checklist_tipos t
join (values
  ('Apertura', 'Encender luces y música', 1),
  ('Apertura', 'Revisar temperatura de refrigeradores', 2),
  ('Apertura', 'Rellenar estaciones de servicio', 3),
  ('Apertura', 'Contar caja chica', 4),
  ('Durante el turno', 'Revisar limpieza de baños', 1),
  ('Durante el turno', 'Supervisar tiempos de cocina', 2),
  ('Cierre', 'Contar caja', 1),
  ('Cierre', 'Guardar inventario de barra', 2),
  ('Cierre', 'Sacar basura', 3),
  ('Cierre', 'Apagar equipos', 4)
) as i(tipo_nombre, nombre, orden) on t.nombre = i.tipo_nombre
on conflict do nothing;

-- ---------- VISTA: comparación mensual de material ----------
create or replace view v_material_mensual as
with ultimo_por_mes as (
  select
    item_id,
    date_trunc('month', fecha) as mes,
    cantidad,
    row_number() over (partition by item_id, date_trunc('month', fecha) order by fecha desc) as rn
  from material_inventario
)
select
  a.item_id,
  mi.nombre as item_nombre,
  mc.nombre as categoria_nombre,
  a.mes as mes_actual,
  a.cantidad as cantidad_actual,
  b.cantidad as cantidad_mes_anterior,
  a.cantidad - coalesce(b.cantidad, a.cantidad) as diferencia
from ultimo_por_mes a
join material_items mi on mi.id = a.item_id
join material_categorias mc on mc.id = mi.categoria_id
left join ultimo_por_mes b
  on b.item_id = a.item_id and b.mes = a.mes - interval '1 month' and b.rn = 1
where a.rn = 1;
