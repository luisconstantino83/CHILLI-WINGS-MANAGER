-- ============================================================
-- CHILLI WINGS MANAGER PRO — Fase 5
-- Simplifica Cerveza: elimina "venta de tu hermana", agrega
-- "ajuste manual", corrige la fórmula, y re-confirma RLS.
-- Corre esto DESPUÉS de schema.sql, fase2, fase3 y fase4.
-- Es seguro volver a correrlo si ya aplicaste parte de esto.
-- ============================================================

-- ------------------------------------------------------------
-- PARTE 1: re-confirmar RLS en las tablas de cerveza (por si
-- las fases anteriores no llegaron a aplicarse completas)
-- ------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select unnest(array['cervezas','inventario_cerveza','ventas_cerveza','entradas_cerveza'])
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
-- PARTE 2: eliminar por completo "venta de tu hermana" y
-- agregar "ajuste manual"
-- ------------------------------------------------------------

alter table ventas_cerveza drop column if exists venta_hermana;
alter table ventas_cerveza drop column if exists incluida_en_sistema;
alter table ventas_cerveza add column if not exists ajuste numeric(10,2) not null default 0;

alter table ventas_cerveza add column if not exists venta_sistema numeric(10,2);
update ventas_cerveza set venta_sistema = piezas_vendidas where venta_sistema is null;
alter table ventas_cerveza alter column venta_sistema set default 0;
alter table ventas_cerveza alter column venta_sistema set not null;

comment on column ventas_cerveza.venta_sistema is 'Venta del sistema/POS (reemplaza a piezas_vendidas)';
comment on column ventas_cerveza.ajuste is 'Ajuste manual o entradas de cerveza, solo si es necesario';

-- ------------------------------------------------------------
-- PARTE 3: recrear la vista de comparación con la fórmula
-- correcta y simplificada (sin "entradas_cerveza" ni "hermana")
--
-- esperado = inventario total de ayer - venta del sistema
--            - cortesías - merma + ajuste
-- diferencia = contado hoy - esperado
-- ------------------------------------------------------------

drop view if exists v_comparacion_cerveza;
create view v_comparacion_cerveza as
select
  hoy.fecha,
  hoy.cerveza_id,
  c.nombre as cerveza_nombre,
  coalesce(ayer.total, 0) as inventario_anterior,
  coalesce(v.venta_sistema, 0) as venta_sistema,
  coalesce(v.cortesias, 0) as cortesias,
  coalesce(v.merma, 0) as merma,
  coalesce(v.ajuste, 0) as ajuste,
  (
    coalesce(ayer.total, 0)
    - coalesce(v.venta_sistema, 0)
    - coalesce(v.cortesias, 0)
    - coalesce(v.merma, 0)
    + coalesce(v.ajuste, 0)
  ) as esperado,
  hoy.total as contado,
  hoy.total - (
    coalesce(ayer.total, 0)
    - coalesce(v.venta_sistema, 0)
    - coalesce(v.cortesias, 0)
    - coalesce(v.merma, 0)
    + coalesce(v.ajuste, 0)
  ) as diferencia
from inventario_cerveza hoy
join cervezas c on c.id = hoy.cerveza_id
left join inventario_cerveza ayer
  on ayer.cerveza_id = hoy.cerveza_id and ayer.fecha = hoy.fecha - interval '1 day'
left join ventas_cerveza v
  on v.cerveza_id = hoy.cerveza_id and v.fecha = hoy.fecha;

-- ------------------------------------------------------------
-- PARTE 4: diagnóstico — corre esta consulta suelta si quieres
-- confirmar que el catálogo de cervezas sí tiene datos:
--   select count(*) from cervezas;
-- Si regresa 0, corre de nuevo la sección de "seed" de cervezas
-- que está en supabase/schema.sql (la parte que empieza con
-- "insert into cervezas (...)").
-- ------------------------------------------------------------
