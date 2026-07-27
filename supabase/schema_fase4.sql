-- ============================================================
-- CHILLI WINGS MANAGER PRO — Fase 4
-- Actividades completas · Cerveza con cortesías/merma/doble venta
-- · Recordatorio de material · Constraints faltantes
-- Corre esto DESPUÉS de schema.sql, schema_fase2.sql y schema_fase3.sql
-- ============================================================

-- ------------------------------------------------------------
-- PARTE 1: actividades_catalogo — campos completos + constraint
-- único (para que los seeds no dupliquen si se vuelve a correr)
-- ------------------------------------------------------------

alter table actividades_catalogo add column if not exists descripcion text;
alter table actividades_catalogo add column if not exists area text;
alter table actividades_catalogo add column if not exists hora_sugerida time;
alter table actividades_catalogo add column if not exists prioridad text not null default 'normal'; -- baja | normal | alta

alter table actividades_completadas add column if not exists observaciones text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'actividades_catalogo_nombre_key'
  ) then
    alter table actividades_catalogo add constraint actividades_catalogo_nombre_key unique (nombre);
  end if;
end $$;

-- Elimina las actividades genéricas de ejemplo de la Fase 1 para
-- reemplazarlas por la lista completa y real que diste. Esto borra
-- también su historial de "completadas" (cascade), aceptable porque
-- es la configuración inicial.
delete from actividades_catalogo where nombre in (
  'Revisar basura', 'Sacar platos', 'Revisar cubiertos', 'Rellenar estaciones',
  'Contar cerveza', 'Revisar baños', 'Revisar postres', 'Inventario de barra',
  'Cuarto frío', 'Inventario de postres', 'Organizar bodega'
);

-- Actividades específicas por día
insert into actividades_catalogo (nombre, dias_semana, area, orden) values
  ('Revisión e inventario de postres', '{1}', 'Cocina/Postres', 100),
  ('Revisión del cuarto frío', '{3}', 'Cocina', 101),
  ('Inventario semanal completo de barra', '{4}', 'Barra', 102),
  ('Revisión e inventario de postres (viernes)', '{5}', 'Cocina/Postres', 103),
  ('Organizar la bodega superior', '{6}', 'Bodega', 104)
on conflict (nombre) do nothing;

-- Actividades diarias (todos los días)
insert into actividades_catalogo (nombre, dias_semana, area, orden) values
  ('Revisar reservaciones', '{0,1,2,3,4,5,6}', 'Recepción', 1),
  ('Revisar cancelaciones y cambios', '{0,1,2,3,4,5,6}', 'Recepción', 2),
  ('Revisar teléfono del restaurante', '{0,1,2,3,4,5,6}', 'Recepción', 3),
  ('Comprobar jabón y papel en baños', '{0,1,2,3,4,5,6}', 'Baños', 4),
  ('Revisar limpieza de baños', '{0,1,2,3,4,5,6}', 'Baños', 5),
  ('Verificar radios cargados', '{0,1,2,3,4,5,6}', 'General', 6),
  ('Verificar presentación y uniforme', '{0,1,2,3,4,5,6}', 'Personal', 7),
  ('Asignar áreas', '{0,1,2,3,4,5,6}', 'Personal', 8),
  ('Asignar fijos y corredores', '{0,1,2,3,4,5,6}', 'Personal', 9),
  ('Revisar basura debajo de las mesas', '{0,1,2,3,4,5,6}', 'Salón', 10),
  ('Revisar basura en estaciones', '{0,1,2,3,4,5,6}', 'Salón', 11),
  ('Retirar platos y muertos', '{0,1,2,3,4,5,6}', 'Salón', 12),
  ('Revisar que el refrigerador de postres quede cerrado', '{0,1,2,3,4,5,6}', 'Cocina/Postres', 13),
  ('Revisar salida de platillos', '{0,1,2,3,4,5,6}', 'Cocina', 14),
  ('Revisar salida de bebidas', '{0,1,2,3,4,5,6}', 'Barra', 15),
  ('Contar cerveza al cierre', '{0,1,2,3,4,5,6}', 'Barra', 16),
  ('Registrar movimientos diarios de barra', '{0,1,2,3,4,5,6}', 'Barra', 17),
  ('Revisar pendientes del turno', '{0,1,2,3,4,5,6}', 'General', 18),
  ('Registrar incidentes', '{0,1,2,3,4,5,6}', 'General', 19),
  ('Realizar cierre operativo', '{0,1,2,3,4,5,6}', 'General', 20)
on conflict (nombre) do nothing;

-- ------------------------------------------------------------
-- PARTE 2: CERVEZA — cortesías, merma, y doble fuente de venta
-- (sistema vs. la que envía tu hermana), evitando duplicar
-- ------------------------------------------------------------

alter table ventas_cerveza add column if not exists venta_hermana numeric(10,2) not null default 0;
alter table ventas_cerveza add column if not exists incluida_en_sistema boolean not null default false;
alter table ventas_cerveza add column if not exists cortesias numeric(10,2) not null default 0;
alter table ventas_cerveza add column if not exists merma numeric(10,2) not null default 0;

comment on column ventas_cerveza.piezas_vendidas is 'Venta reportada por el sistema/POS';
comment on column ventas_cerveza.venta_hermana is 'Venta informada por tu hermana';
comment on column ventas_cerveza.incluida_en_sistema is 'Marca true si la venta de tu hermana YA está contada dentro de piezas_vendidas (para no restarla dos veces)';

-- Reemplaza la vista de comparación con la fórmula completa:
-- teórico = inicial + entradas - venta_sistema - venta_hermana(si no está incluida) - cortesías - merma
-- (drop primero porque cambiamos nombres/orden de columnas, y Postgres no
-- permite eso con CREATE OR REPLACE VIEW, solo agregar columnas al final)
drop view if exists v_comparacion_cerveza;
create view v_comparacion_cerveza as
select
  hoy.fecha,
  hoy.cerveza_id,
  c.nombre as cerveza_nombre,
  ayer.total as inventario_anterior,
  coalesce(e.piezas_total, 0) as entradas,
  coalesce(v.piezas_vendidas, 0) as venta_sistema,
  coalesce(v.venta_hermana, 0) as venta_hermana,
  coalesce(v.incluida_en_sistema, false) as venta_hermana_incluida,
  coalesce(v.cortesias, 0) as cortesias,
  coalesce(v.merma, 0) as merma,
  (
    coalesce(ayer.total, 0)
    + coalesce(e.piezas_total, 0)
    - coalesce(v.piezas_vendidas, 0)
    - (case when coalesce(v.incluida_en_sistema, false) then 0 else coalesce(v.venta_hermana, 0) end)
    - coalesce(v.cortesias, 0)
    - coalesce(v.merma, 0)
  ) as esperado,
  hoy.total as contado,
  hoy.total - (
    coalesce(ayer.total, 0)
    + coalesce(e.piezas_total, 0)
    - coalesce(v.piezas_vendidas, 0)
    - (case when coalesce(v.incluida_en_sistema, false) then 0 else coalesce(v.venta_hermana, 0) end)
    - coalesce(v.cortesias, 0)
    - coalesce(v.merma, 0)
  ) as diferencia
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

-- ------------------------------------------------------------
-- PARTE 3: MATERIAL — estado (sin cambio/pérdida/aumento) y
-- porcentaje de pérdida en la vista mensual
-- ------------------------------------------------------------

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
  a.cantidad - coalesce(b.cantidad, a.cantidad) as diferencia,
  case
    when b.cantidad is null or b.cantidad = 0 then 0
    else round(((a.cantidad - b.cantidad) / b.cantidad) * 100, 1)
  end as porcentaje_diferencia,
  case
    when b.cantidad is null then 'sin_historial'
    when a.cantidad = b.cantidad then 'sin_cambio'
    when a.cantidad < b.cantidad and (b.cantidad - a.cantidad) > (b.cantidad * 0.1) then 'requiere_revision'
    when a.cantidad < b.cantidad then 'perdida'
    else 'aumento'
  end as estado
from ultimo_por_mes a
join material_items mi on mi.id = a.item_id
join material_categorias mc on mc.id = mi.categoria_id
left join ultimo_por_mes b
  on b.item_id = a.item_id and b.mes = a.mes - interval '1 month' and b.rn = 1
where a.rn = 1;

-- Vista de recordatorio: próximo inventario de material (1 mes
-- después del último) y si ya estamos dentro de los 7 días previos
create or replace view v_material_proximo_inventario as
select
  max(fecha) as ultimo_inventario,
  (max(fecha) + interval '1 month')::date as proximo_inventario,
  (max(fecha) + interval '1 month' - current_date) <= interval '7 days' as alerta_activa
from material_inventario;

-- ------------------------------------------------------------
-- PARTE 4: resúmenes rápidos para el Dashboard
-- ------------------------------------------------------------

create or replace view v_ultimo_inventario_cerveza as
select fecha, count(*) as cervezas_contadas, sum(total) as total_piezas
from inventario_cerveza
group by fecha
order by fecha desc
limit 1;

create or replace view v_ultimo_inventario_barra_semanal as
select fecha, count(*) as productos_contados
from barra_inventario
group by fecha
order by fecha desc
limit 1;
