-- ============================================================
-- CHILLI WINGS MANAGER PRO — Fase 1
-- Catálogo de cerveza, inventario diario, ventas y comparación
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ---------- CATÁLOGO DE CERVEZAS ----------
create table if not exists cervezas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  formato text not null default 'botella', -- botella | litro | caguama
  orden int not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- INVENTARIO DIARIO DE CERVEZA ----------
-- Un registro por cerveza por fecha. Nunca se sobreescribe: cada día es un registro nuevo.
create table if not exists inventario_cerveza (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  cerveza_id uuid not null references cervezas(id) on delete restrict,
  bodega numeric(10,2) not null default 0,
  cuarto_frio numeric(10,2) not null default 0,
  caja numeric(10,2) not null default 0, -- refrigerador
  barra numeric(10,2) not null default 0,
  total numeric(10,2) generated always as (bodega + cuarto_frio + caja + barra) stored,
  created_at timestamptz not null default now(),
  unique (fecha, cerveza_id)
);

create index if not exists idx_inventario_cerveza_fecha on inventario_cerveza (fecha);
create index if not exists idx_inventario_cerveza_cerveza on inventario_cerveza (cerveza_id);

-- ---------- VENTAS DIARIAS DE CERVEZA ----------
create table if not exists ventas_cerveza (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  cerveza_id uuid not null references cervezas(id) on delete restrict,
  piezas_vendidas numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (fecha, cerveza_id)
);

-- ---------- ENTRADAS (compras/recepciones) DE CERVEZA ----------
-- Opcional: si entra mercancía nueva ese día, se suma al esperado.
create table if not exists entradas_cerveza (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  cerveza_id uuid not null references cervezas(id) on delete restrict,
  piezas numeric(10,2) not null default 0,
  nota text,
  created_at timestamptz not null default now()
);

-- ---------- VISTA: COMPARACIÓN ESPERADO VS FÍSICO ----------
-- esperado = inventario del día anterior + entradas del día - ventas del día
create or replace view v_comparacion_cerveza as
select
  hoy.fecha,
  hoy.cerveza_id,
  c.nombre as cerveza_nombre,
  ayer.total as inventario_anterior,
  coalesce(e.piezas_total, 0) as entradas,
  coalesce(v.piezas_vendidas, 0) as ventas,
  (coalesce(ayer.total, 0) + coalesce(e.piezas_total, 0) - coalesce(v.piezas_vendidas, 0)) as esperado,
  hoy.total as contado,
  hoy.total - (coalesce(ayer.total, 0) + coalesce(e.piezas_total, 0) - coalesce(v.piezas_vendidas, 0)) as diferencia
from inventario_cerveza hoy
join cervezas c on c.id = hoy.cerveza_id
left join inventario_cerveza ayer
  on ayer.cerveza_id = hoy.cerveza_id and ayer.fecha = hoy.fecha - interval '1 day'
left join ventas_cerveza v
  on v.cerveza_id = hoy.cerveza_id and v.fecha = hoy.fecha
left join (
  select cerveza_id, fecha, sum(piezas) as piezas_total
  from entradas_cerveza
  group by cerveza_id, fecha
) e on e.cerveza_id = hoy.cerveza_id and e.fecha = hoy.fecha;

-- ---------- ACTIVIDADES DIARIAS (checklist del dashboard) ----------
create table if not exists actividades_catalogo (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  dias_semana int[] not null default '{0,1,2,3,4,5,6}', -- 0=domingo ... 6=sábado
  activo boolean not null default true,
  orden int not null default 0
);

create table if not exists actividades_completadas (
  id uuid primary key default gen_random_uuid(),
  actividad_id uuid not null references actividades_catalogo(id) on delete cascade,
  fecha date not null,
  hora timestamptz not null default now(),
  unique (actividad_id, fecha)
);

-- ---------- SEED: catálogo de cervezas (orden = como en la hoja física) ----------
insert into cervezas (nombre, formato, orden) values
  ('Tecate Roja', 'botella', 1),
  ('Tecate Light', 'botella', 2),
  ('Indio', 'botella', 3),
  ('XX Lager', 'botella', 4),
  ('XX Ámbar', 'botella', 5),
  ('XX Ultra', 'botella', 6),
  ('Bohemia Clara', 'botella', 7),
  ('Bohemia Oscura', 'botella', 8),
  ('Bohemia Cristal', 'botella', 9),
  ('Miller High Life', 'botella', 10),
  ('Miller Lite', 'botella', 11),
  ('Amstel', 'botella', 12),
  ('Heineken', 'botella', 13),
  ('Heineken 0', 'botella', 14),
  ('Heineken Silver', 'botella', 15),
  ('Carta Blanca', 'botella', 16),
  ('Tecate Light Litro', 'litro', 17),
  ('Indio Litro', 'litro', 18),
  ('XX Lager Litro', 'litro', 19),
  ('Caguama', 'caguama', 20)
on conflict (nombre) do nothing;

-- ---------- SEED: actividades base del dashboard ----------
insert into actividades_catalogo (nombre, dias_semana, orden) values
  ('Revisar basura', '{0,1,2,3,4,5,6}', 1),
  ('Sacar platos', '{0,1,2,3,4,5,6}', 2),
  ('Revisar cubiertos', '{0,1,2,3,4,5,6}', 3),
  ('Rellenar estaciones', '{0,1,2,3,4,5,6}', 4),
  ('Contar cerveza', '{0,1,2,3,4,5,6}', 5),
  ('Revisar baños', '{0,1,2,3,4,5,6}', 6),
  ('Revisar postres', '{0,1,2,3,4,5,6}', 7),
  ('Inventario de barra', '{4}', 8),
  ('Cuarto frío', '{3}', 9),
  ('Inventario de postres', '{1,5}', 10),
  ('Organizar bodega', '{6}', 11)
on conflict do nothing;

-- ============================================================
-- NOTA SOBRE SEGURIDAD (RLS)
-- Esta app es de un solo usuario (el Encargado). Por simplicidad,
-- Fase 1 no activa Row Level Security. Antes de compartir el acceso
-- con más de una persona, activa RLS y agrega políticas por usuario.
-- ============================================================
