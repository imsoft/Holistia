# 🚨 URGENTE: Fix Duplicate Google Calendar Blocks

## Problema
Los eventos de Google Calendar se están duplicando masivamente en la tabla `availability_blocks`, causando que:
- Los profesionales vean múltiples copias del mismo evento
- La interfaz de reservas muestre "+2 más", "+3 más", "+4 más", etc.
- La sincronización cree nuevos duplicados cada vez que se ejecuta

## Causa Raíz
1. Google Calendar API con `singleEvents: true` expande eventos recurrentes en instancias individuales
2. Todas las instancias tienen el mismo `event_id` pero diferentes fechas/horas
3. La lógica de deduplicación mejorada ya está implementada en el código
4. Sin embargo, duplicados antiguos persisten en la base de datos
5. **Falta un constraint a nivel de base de datos** para prevenir duplicados

## Solución
La migración `131_add_unique_constraint_availability_blocks.sql` hace dos cosas:

1. **Limpia duplicados existentes** - Mantiene solo el bloque más antiguo de cada grupo duplicado
2. **Previene duplicados futuros** - Crea un índice único en la combinación:
   - `google_calendar_event_id`
   - `start_date`
   - `start_time` (o 'full_day' si es evento de día completo)
   - `end_time` (o 'full_day' si es evento de día completo)

## 🚨 SITUACIÓN ACTUAL - ACTUALIZACIÓN

### Problema 1: Duplicados ✅ RESUELTO
- ✅ El **constraint único YA EXISTE** en la base de datos
- ✅ Los duplicados fueron eliminados con el script de limpieza
- ✅ El constraint previene que se creen nuevos duplicados

### Problema 2: Fechas Incorrectas ⚠️ CRÍTICO
Después de revisar los datos, se encontró un segundo problema:

**Eventos de día completo sin fecha de fin:**
- Google Calendar devuelve la fecha de fin como **exclusiva** (el día después)
- Ejemplo: Evento del 6 de diciembre
  - Google devuelve: `start: "2025-12-06"`, `end: "2025-12-07"`
  - Holistia guardaba: `start_date: "2025-12-06"`, `end_date: "2025-12-07"` ❌
  - Debería guardar: `start_date: "2025-12-06"`, `end_date: "2025-12-06"` ✅

**Eventos con hora sin end_date:**
- Los eventos time_range no estaban guardando `end_date`
- Esto causa problemas si el evento cruza medianoche

**FIX APLICADO:**
- ✅ Se corrigió la lógica para restar 1 día a la fecha de fin de eventos completos
- ✅ Se agregó `end_date` a eventos time_range
- ⚠️ **PERO** los bloques existentes tienen fechas incorrectas
- 🔧 **SOLUCIÓN:** Eliminar todos los bloques y re-sincronizar

## 📋 Pasos para Aplicar (ACTUALIZADOS)

### ⚡ PASO 1: Resetear Bloques de Google Calendar

**Ejecuta este script en Supabase SQL Editor:**

```bash
database/migrations/EJECUTAR_AHORA_reset_google_blocks.sql
```

Este script:
1. Muestra cuántos bloques externos hay
2. **ELIMINA TODOS** los bloques de Google Calendar
3. Verifica que se eliminaron correctamente
4. Confirma que los bloques internos (creados en Holistia) NO fueron afectados

⚠️ **IMPORTANTE:** Esto solo elimina bloques sincronizados de Google Calendar, NO elimina bloques creados manualmente en Holistia.

### ⚡ PASO 2: Re-sincronizar Google Calendar

Después de ejecutar el script:

1. Ve a: `https://www.holistia.io/admin/[professional-id]/sync-tools`
2. Haz clic en **"Forzar Sincronización"**
3. Espera a que complete

**Resultado esperado:**
- ✅ Todos los eventos se sincronizarán con fechas correctas
- ✅ Eventos de día completo tendrán `start_date = end_date`
- ✅ Eventos con hora tendrán `end_date` correctamente establecido
- ✅ Sin duplicados (protegido por el constraint único)

---

### 📝 SCRIPTS ANTERIORES (YA EJECUTADOS)

~~**EJECUTAR_AHORA_clean_existing_duplicates.sql**~~ - Ya ejecutado, duplicados eliminados ✅

### 📝 OPCIÓN DETALLADA

### 1. Backup (IMPORTANTE)
Antes de aplicar, haz un backup de la tabla:

```sql
-- En tu panel de Supabase SQL Editor
CREATE TABLE availability_blocks_backup_20241203 AS
SELECT * FROM availability_blocks;
```

### 2. Verificar Estado Actual
Revisa cuántos duplicados existen:

```sql
-- Contar duplicados por profesional
SELECT
  professional_id,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as unique_blocks,
  COUNT(*) - COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as duplicates
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL
GROUP BY professional_id
HAVING COUNT(*) > COUNT(DISTINCT (
  google_calendar_event_id || '_' ||
  start_date || '_' ||
  COALESCE(start_time::text, 'full_day') || '_' ||
  COALESCE(end_time::text, 'full_day')
));
```

### 3. Aplicar la Migración

```bash
# Opción A: Ejecutar directamente en Supabase SQL Editor
# Copia y pega el contenido de:
# database/migrations/131_add_unique_constraint_availability_blocks.sql
```

O desde la terminal con psql:

```bash
# Opción B: Usar psql (necesitas las credenciales de conexión)
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]" \
  -f database/migrations/131_add_unique_constraint_availability_blocks.sql
```

### 4. Verificar Resultados

Después de aplicar, verifica:

```sql
-- 1. Ver el índice único creado
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'availability_blocks'
  AND indexname = 'idx_availability_blocks_unique_external_event';

-- 2. Verificar que no hay duplicados
SELECT
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day') as start_time,
  COALESCE(end_time::text, 'full_day') as end_time,
  COUNT(*) as count
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL
GROUP BY
  google_calendar_event_id,
  start_date,
  COALESCE(start_time::text, 'full_day'),
  COALESCE(end_time::text, 'full_day')
HAVING COUNT(*) > 1;
-- Esto debe devolver 0 filas
```

### 5. Probar Sincronización

Después de aplicar la migración:

1. Ve a: `https://www.holistia.io/admin/[professional-id]/sync-tools`
2. Haz clic en "Forzar Sincronización"
3. Verifica que NO se creen duplicados
4. Si intentas crear un duplicado manualmente, PostgreSQL debe rechazarlo con error de constraint único

## 🎯 Resultado Esperado

Después de aplicar esta migración:

✅ Todos los duplicados existentes habrán sido eliminados (se mantiene el más antiguo de cada grupo)
✅ El índice único impedirá que se creen nuevos duplicados
✅ La sincronización de Google Calendar funcionará sin crear duplicados
✅ Los eventos recurrentes seguirán funcionando correctamente (cada fecha/hora es única)
✅ El calendario del profesional mostrará cada evento solo una vez

## ❌ Qué Hacer si Hay Problemas

Si después de aplicar la migración hay errores:

### Error: "duplicate key value violates unique constraint"
Esto es ESPERADO y BUENO. Significa que:
- El constraint está funcionando
- Está previniendo que se creen duplicados
- La sincronización está intentando crear un duplicado y PostgreSQL lo rechaza

**Solución**: No hacer nada, el constraint está funcionando correctamente.

### Error al aplicar la migración
Si la migración falla al ejecutarse:

1. Revisa el mensaje de error exacto
2. Verifica que el índice no exista ya:
   ```sql
   DROP INDEX IF EXISTS idx_availability_blocks_unique_external_event;
   ```
3. Intenta aplicar la migración nuevamente

### Restaurar desde backup
Si necesitas revertir:

```sql
-- SOLO si algo sale mal
DELETE FROM availability_blocks;
INSERT INTO availability_blocks
SELECT * FROM availability_blocks_backup_20241203;
```

## 📊 Monitoreo Post-Migración

Después de 24 horas, revisa:

```sql
-- Verificar que no hay nuevos duplicados
SELECT
  professional_id,
  COUNT(*) as total_blocks,
  COUNT(DISTINCT (
    google_calendar_event_id || '_' ||
    start_date || '_' ||
    COALESCE(start_time::text, 'full_day') || '_' ||
    COALESCE(end_time::text, 'full_day')
  )) as unique_blocks
FROM availability_blocks
WHERE is_external_event = true
  AND google_calendar_event_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY professional_id;
-- total_blocks debe ser igual a unique_blocks
```

## 🔗 Archivos Relacionados

- Migración: `database/migrations/131_add_unique_constraint_availability_blocks.sql`
- Lógica de sync: `src/actions/google-calendar/sync.ts`
- Endpoint de limpieza: `src/app/api/admin/clean-duplicate-blocks/route.ts`
- UI de admin: `src/app/(dashboard)/(admin)/admin/[id]/sync-tools/page.tsx`

## ⏰ Cuándo Aplicar

**AHORA MISMO** - Este es un fix crítico que está afectando a profesionales y pacientes.

La migración es segura porque:
- Solo afecta bloques externos de Google Calendar
- Mantiene el bloque más antiguo (el original)
- No afecta eventos creados manualmente en Holistia
- Es reversible con el backup
