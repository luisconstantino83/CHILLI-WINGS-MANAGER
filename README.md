# Chilli Wings Manager Pro — Fase 1

Dashboard + Inventario de Cerveza (registro diario, historial, ventas y comparación esperado vs. contado).

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com y crea un proyecto nuevo (gratis).
2. Ve a **SQL Editor** → **New query**.
3. Copia y pega todo el contenido de `supabase/schema.sql` de este proyecto y dale **Run**.
   Esto crea las tablas, la vista de comparación y precarga el catálogo de cervezas y actividades.
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

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

## Qué incluye esta fase

- **Dashboard**: actividades del día (según día de la semana), progreso, alertas de faltantes/sobrantes de cerveza.
- **Inventario de cerveza**: mismo formato que tu hoja física (Bodega / Cuarto frío / Refrigerador / Barra), suma automática de Total, comparación contra el día anterior, registro de ventas del día, y cálculo automático de **esperado vs. contado** (faltante/sobrante).
- **Historial**: cada día se guarda como un registro nuevo — nunca se sobreescribe.

## Próximas fases

Barra · Postres · Material (platos/tarros/cristalería) · Personal · Checklists de apertura/cierre · Reportes PDF/Excel · Gráficas mensuales.
