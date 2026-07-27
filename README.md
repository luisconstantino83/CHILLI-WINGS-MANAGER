# Chilli Wings Manager Pro — Fase 1

Dashboard + Inventario de Cerveza (registro diario, historial, ventas y comparación esperado vs. contado).

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea un proyecto nuevo (gratis).
2. Ve a **SQL Editor** → **New query**.
3. Copia y pega todo el contenido de `supabase/schema.sql` y dale **Run**.
   Esto crea las tablas de cerveza, la vista de comparación y las actividades del dashboard.
4. Abre **New query** otra vez, copia y pega todo el contenido de `supabase/schema_fase2.sql` y dale **Run**.
   Esto agrega Barra, Postres, Material, Personal y Checklists.
5. Abre **New query** una tercera vez, copia y pega todo el contenido de `supabase/schema_fase3.sql` y dale **Run**.
   **Este paso es crítico**: activa las políticas de seguridad (RLS) que permiten que la app lea y escriba datos —
   sin esto, las páginas se ven vacías aunque las tablas existan. También agrega Reservaciones, el control diario
   de movimientos de barra, y precarga tu inventario real de material.
6. Abre **New query** una cuarta vez, copia y pega todo el contenido de `supabase/schema_fase4.sql` y dale **Run**.
   Esto agrega la lista completa de actividades recurrentes (las ~25 que me diste, por día), cortesías/merma/venta
   de tu hermana en cerveza, el estado de cada artículo de material (pérdida/aumento/sin cambio), y el recordatorio
   automático de 7 días antes del inventario mensual.
7. Abre **New query** una quinta vez, copia y pega todo el contenido de `supabase/schema_fase5.sql` y dale **Run**.
   Esto elimina por completo el concepto de "venta de tu hermana", agrega "ajuste manual", y corrige la fórmula
   de comparación de cerveza (esperado = ayer − venta del sistema − cortesías − merma + ajuste).
8. Ve a **Settings → Data API** y copia el **Project URL**.
9. Ve a **Settings → API Keys → pestaña Legacy API Keys** y copia la clave **anon / public**.

## 2. Subir el código a GitHub

1. Crea un repositorio nuevo (vacío) en https://github.com/new — por ejemplo `chilli-wings-manager`.
2. Desde esta carpeta en tu computadora:
   ```bash
   git init
   git add .
   git commit -m "Fase 1: dashboard + inventario de cerveza"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/chilli-wings-manager.git
   git push -u origin main
   ```

## 3. Desplegar en Vercel

1. Entra a https://vercel.com → **Add New → Project**.
2. Importa el repo que acabas de subir.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = (el Project URL de Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (el anon key de Supabase)
4. Dale **Deploy**. En 1-2 minutos tendrás tu URL en vivo (algo como `chilli-wings-manager.vercel.app`).

## 4. Instalarla como app en tu iPhone/iPad

1. Abre la URL de Vercel en Safari.
2. Toca **Compartir → Agregar a pantalla de inicio**.
3. Listo — se abre como app, a pantalla completa.

## Desarrollo local (opcional)

```bash
npm install
cp .env.example .env.local   # y llena tus llaves de Supabase
npm run dev
```

## Qué incluye la app

- **Dashboard**: actividades del día (según día de la semana), progreso, alertas de faltantes/sobrantes de cerveza.
- **Cerveza**: mismo formato que tu hoja física (Bodega / Cuarto frío / Refrigerador / Barra), suma automática de Total, comparación contra el día anterior, registro de ventas del día, y cálculo automático de **esperado vs. contado** (faltante/sobrante).
- **Barra**: inventario de licores, jarabes, jugos y fresco, con cantidades decimales, agrupado por categoría.
- **Postres**: inventario por sabor con alerta automática de "pocas piezas" según un umbral configurable.
- **Material**: platos, tarros, vasos, jarras, tequileros, cristalería y cubiertos, con comparación mensual (roto/perdido/sobrante) una vez que tengas al menos 2 meses de historial.
- **Personal**: lista de empleados con área y horario, más notas de observación/capacitación/llamada de atención.
- **Checklists**: apertura, durante el turno y cierre, con progreso diario.
- **Reportes**: gráficas de los últimos 30 días de cerveza (faltantes/sobrantes por día, cervezas con más diferencias) y exportación a Excel y PDF (impresión).
- **Historial completo en todo el sistema**: cada día es un registro nuevo — nunca se sobreescribe.

## Próximas mejoras posibles

- Gráficas de barra/postres/material en Reportes (una vez tengas más historial acumulado)
- Sección de Incidencias (cristalería rota, clientes complicados, con fotos)
- Autenticación (login) si algún día compartes el acceso con más de una persona
