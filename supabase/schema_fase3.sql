-- ============================================================
-- CHILLI WINGS MANAGER PRO — Fase 3
-- RLS (arreglo crítico) · Reservaciones · Movimientos diarios de barra
-- · Inventario inicial real de material
-- Corre esto DESPUÉS de schema.sql y schema_fase2.sql
-- ============================================================

-- ------------------------------------------------------------
-- PARTE 1: RLS — esta es la causa más probable de que todo
-- se vea vacío (Dashboard 0/0, Postres vacío, Checklists vacíos,
-- Barra sin productos). Sin políticas, las consultas regresan
-- cero filas en silencio en vez de dar error.
--
-- Esta app es de un solo usuario (tú, el Encargado) y usa la
-- clave "anon" del lado del cliente — no tiene login todavía.
-- Por eso, las políticas de abajo permiten TODO (select/insert/
-- update/delete) a cualquiera que tenga esa clave anon, que es
-- exactamente el modelo de seguridad que ya tenías (la clave
-- vive en el navegador). El día que quieras compartir acceso
-- con más gente y restringir por usuario, ahí sí se necesita
-- agregar autenticación real y políticas por usuario.
-- ------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'cervezas','inventario_cerveza','ventas_cerveza','entradas_cerveza',
      'actividades_catalogo','actividades_completadas',
      'barra_items','barra_inventario',
      'postres_items','postres_inventario',
      'material_categorias','material_items','material_inventario',
      'empleados','empleados_notas',
      'checklist_tipos','checklist_items','checklist_completados'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "allow_all_anon" on %I;', t);
    execute format(
      'create policy "allow_all_anon" on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- PARTE 2: RESERVACIONES (módulo nuevo, no existía)
-- ------------------------------------------------------------

create table if not exists reservaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_nombre text not null,
  telefono text,
  fecha date not null,
  hora time not null,
  personas int not null default 2,
  area text not null default 'A', -- A | B | C | Terraza
  mesa text,
  motivo text,
  notas text,
  estatus text not null default 'pendiente', -- pendiente | confirmada | presente | no_presento | cancelada
  registrado_por text,
  created_at timestamptz not null default now()
);

alter table reservaciones enable row level security;
drop policy if exists "allow_all_anon" on reservaciones;
create policy "allow_all_anon" on reservaciones for all to anon, authenticated using (true) with check (true);

create index if not exists idx_reservaciones_fecha on reservaciones (fecha);

-- ------------------------------------------------------------
-- PARTE 3: MOVIMIENTOS DIARIOS DE BARRA (distinto al
-- inventario semanal del jueves que ya existe en barra_inventario)
-- ------------------------------------------------------------

create table if not exists movimientos_barra_diarios (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  item_id uuid not null references barra_items(id) on delete restrict,
  existencia_inicial numeric(10,2) not null default 0,
  entradas numeric(10,2) not null default 0,
  bajada_almacen numeric(10,2) not null default 0,
  consumo numeric(10,2) not null default 0,
  merma numeric(10,2) not null default 0,
  ajuste numeric(10,2) not null default 0,
  existencia_final_contada numeric(10,2),
  existencia_teorica numeric(10,2) generated always as (
    existencia_inicial + entradas + bajada_almacen - consumo - merma + ajuste
  ) stored,
  responsable text,
  observaciones text,
  created_at timestamptz not null default now(),
  unique (fecha, item_id)
);

alter table movimientos_barra_diarios enable row level security;
drop policy if exists "allow_all_anon" on movimientos_barra_diarios;
create policy "allow_all_anon" on movimientos_barra_diarios for all to anon, authenticated using (true) with check (true);

create or replace view v_movimientos_barra_diferencia as
select
  m.*,
  bi.nombre as item_nombre,
  (m.existencia_final_contada - m.existencia_teorica) as diferencia
from movimientos_barra_diarios m
join barra_items bi on bi.id = m.item_id;

-- ------------------------------------------------------------
-- PARTE 4: MATERIAL — catálogo real + inventario inicial histórico
-- ------------------------------------------------------------

-- Categorías adicionales que faltaban
insert into material_categorias (nombre, orden) values
  ('Utensilios', 8), ('Equipo', 9), ('Otros', 10)
on conflict (nombre) do nothing;

-- Artículos reales (si ya tenías genéricos de la Fase 2, estos se agregan aparte)
insert into material_items (categoria_id, nombre, orden)
select mc.id, v.nombre, v.orden from material_categorias mc
join (values
  ('Platos', 'Chicos círculo verde', 1),
  ('Platos', 'Chicos lisos blancos', 2),
  ('Platos', 'Grandes', 3),
  ('Platos', 'Vidrio', 4),
  ('Platos', 'Medianos', 5),
  ('Vasos', 'Coca refill rojos', 6),
  ('Vasos', 'Coca refill amarillos', 7),
  ('Vasos', 'Limonada/té/Coca botella chicos', 8),
  ('Vasos', 'Limonada/té/Coca botella grandes', 9),
  ('Tarros', 'Michelada medianos', 10),
  ('Tarros', 'Michelada grandes', 11),
  ('Tarros', 'Michelada chicos lisos', 12),
  ('Tarros', 'Michelada estrella chicos', 13),
  ('Tarros', 'Limonada mineral chico', 14),
  ('Jarras', 'Jarra lisa', 15),
  ('Jarras', 'Jarra con rayas', 16),
  ('Tarros', 'Margarita', 17),
  ('Tequileros', 'Tequilero chico', 18),
  ('Tequileros', 'Tequilero mediano', 19),
  ('Tequileros', 'Tequilero doble', 20),
  ('Cristalería', 'Vasos para vodka', 21),
  ('Cristalería', 'Vasos para whisky', 22)
) as v(categoria_nombre, nombre, orden) on mc.nombre = v.categoria_nombre
on conflict do nothing;

-- Inventario inicial histórico (con las cantidades que ya me diste)
-- Usa la fecha de hoy como punto de partida; puedes corregirlo después
-- desde la página de Material si alguna cantidad no quedó exacta.
insert into material_inventario (fecha, item_id, cantidad)
select current_date, mi.id, v.cantidad
from material_items mi
join (values
  ('Chicos círculo verde', 126),
  ('Chicos lisos blancos', 43),
  ('Grandes', 119),
  ('Vidrio', 7),
  ('Medianos', 5),
  ('Coca refill rojos', 9),
  ('Coca refill amarillos', 14),
  ('Limonada/té/Coca botella chicos', 43),
  ('Limonada/té/Coca botella grandes', 16),
  ('Michelada medianos', 20),
  ('Michelada grandes', 9),
  ('Michelada chicos lisos', 37),
  ('Michelada estrella chicos', 21),
  ('Limonada mineral chico', 7),
  ('Jarra lisa', 11),
  ('Jarra con rayas', 4),
  ('Margarita', 45),
  ('Tequilero chico', 2),
  ('Tequilero mediano', 10),
  ('Tequilero doble', 3),
  ('Vasos para vodka', 9),
  ('Vasos para whisky', 6)
) as v(nombre, cantidad) on mi.nombre = v.nombre
on conflict (fecha, item_id) do update set cantidad = excluded.cantidad;
