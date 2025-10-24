# ✅ Actualización: Duración de Eventos con Días

## 📋 Resumen de la Mejora

Se ha agregado la capacidad de especificar la duración de los eventos en **días** además de **horas**. Ahora al crear o editar un evento, puedes seleccionar si la duración es en horas o días.

## 🎯 Características Nuevas

### 1. Selector de Unidad de Duración
- ✅ **Horas**: Para eventos cortos (1-24 horas)
- ✅ **Días**: Para eventos largos (1-30 días)

### 2. Límites Dinámicos
- **Horas**: De 1 a 24 horas
- **Días**: De 1 a 30 días

### 3. Conversión Automática
- Cuando seleccionas "Días", el sistema convierte automáticamente a horas antes de guardar
- Ejemplo: 2 días = 48 horas en la base de datos
- Al cargar un evento existente, si tiene duration_unit = "days", convierte de vuelta a días para mostrar

## 🛠️ Cambios Implementados

### 1. **Base de Datos** 
**Archivo**: `database/migrations/58_add_duration_unit_to_events.sql`

**Cambios**:
- ✅ Nueva columna `duration_unit` (valores: 'hours' o 'days')
- ✅ Modificado constraint de `duration_hours` para permitir hasta 720 horas (30 días)
- ✅ Valor por defecto 'hours' para eventos existentes

### 2. **Tipos TypeScript**
**Archivo**: `src/types/event.ts`

**Cambios**:
- ✅ Agregado `duration_unit?: "hours" | "days"` a `EventWorkshop`
- ✅ Agregado `duration_unit: "hours" | "days"` a `EventFormData`
- ✅ Nueva constante `DURATION_UNITS` con opciones

### 3. **Formulario de Eventos**
**Archivo**: `src/components/ui/event-form.tsx`

**Cambios**:
- ✅ Nuevo selector de unidad (Horas/Días)
- ✅ Label dinámico que cambia según la unidad seleccionada
- ✅ Límites máximos ajustables automáticamente
- ✅ Conversión automática días → horas al guardar
- ✅ Conversión automática horas → días al cargar (si aplica)

## 🚀 Pasos para Aplicar

### Paso 1: Aplicar la Migración en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Abre **SQL Editor**
3. Copia el contenido de `database/migrations/58_add_duration_unit_to_events.sql`
4. Pégalo y ejecuta con **Run**

**Contenido de la migración**:
```sql
-- Agregar columna duration_unit
ALTER TABLE events_workshops 
ADD COLUMN IF NOT EXISTS duration_unit VARCHAR(10) DEFAULT 'hours' CHECK (duration_unit IN ('hours', 'days'));

-- Modificar constraint de duration_hours
ALTER TABLE events_workshops 
DROP CONSTRAINT IF EXISTS events_workshops_duration_hours_check;

ALTER TABLE events_workshops 
ADD CONSTRAINT events_workshops_duration_hours_check CHECK (duration_hours > 0 AND duration_hours <= 720);

-- Actualizar eventos existentes
UPDATE events_workshops 
SET duration_unit = 'hours' 
WHERE duration_unit IS NULL;
```

### Paso 2: Verificar que funcionó

Ejecuta en el SQL Editor:

```sql
-- Ver la estructura actualizada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'events_workshops'
AND column_name IN ('duration_hours', 'duration_unit');

-- Ver todos los eventos y sus duraciones
SELECT id, name, duration_hours, duration_unit
FROM events_workshops
LIMIT 10;
```

### Paso 3: Reiniciar la Aplicación

Los cambios del frontend ya están desplegados, solo asegúrate de tener la última versión:

```bash
git pull origin main
pnpm install  # Solo si hay cambios en dependencias
```

Si estás en desarrollo local:
```bash
pnpm dev
```

## 🎨 Cómo Se Ve en la UI

### Antes (solo horas):
```
┌─────────────────────────────────────┐
│ Duración (horas) *                  │
│ ┌─────────────────────────────────┐ │
│ │ 2                               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Ahora (horas o días):
```
┌──────────────┬──────────────┬────────────────┐
│ Duración     │ Unidad *     │ Tipo de        │
│ (horas) *    │              │ Experiencia *  │
├──────────────┼──────────────┼────────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌────────────┐ │
│ │ 2        │ │ │ Horas ▼  │ │ │ Sesión U...│ │
│ └──────────┘ │ └──────────┘ │ └────────────┘ │
└──────────────┴──────────────┴────────────────┘

// Si seleccionas "Días":
┌──────────────┬──────────────┬────────────────┐
│ Duración     │ Unidad *     │ Tipo de        │
│ (días) *     │              │ Experiencia *  │
├──────────────┼──────────────┼────────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌────────────┐ │
│ │ 3        │ │ │ Días ▼   │ │ │ Sesión U...│ │
│ └──────────┘ │ └──────────┘ │ └────────────┘ │
└──────────────┴──────────────┴────────────────┘
```

## 📝 Ejemplos de Uso

### Evento de 1 día (retiro de fin de semana)
```
Duración: 1
Unidad: Días
→ Se guarda como: duration_hours = 24, duration_unit = 'days'
```

### Evento de 3 días (taller intensivo)
```
Duración: 3
Unidad: Días
→ Se guarda como: duration_hours = 72, duration_unit = 'days'
```

### Evento de 2 horas (sesión de yoga)
```
Duración: 2
Unidad: Horas
→ Se guarda como: duration_hours = 2, duration_unit = 'hours'
```

## 🔧 Detalles Técnicos

### Conversión Días ↔ Horas

**Al guardar**:
```typescript
const durationInHours = formData.duration_unit === "days" 
  ? formData.duration_hours * 24 
  : formData.duration_hours;
```

**Al cargar**:
```typescript
const durationUnit = event.duration_unit || "hours";
let displayDuration = event.duration_hours;

if (durationUnit === "days") {
  displayDuration = Math.round(event.duration_hours / 24);
}
```

### Validación

- **Horas**: min=1, max=24
- **Días**: min=1, max=30
- Al cambiar la unidad, se ajusta automáticamente el valor si excede el límite

### Comportamiento con Eventos Existentes

- Eventos creados antes de esta actualización:
  - `duration_unit` = `'hours'` (por defecto)
  - `duration_hours` = valor original
  - Se muestran y editan normalmente en horas

## ✨ Beneficios

1. **Flexibilidad** 📅
   - Eventos cortos en horas
   - Eventos largos en días
   - Interfaz más clara e intuitiva

2. **Usabilidad** 🎯
   - No necesitas calcular manualmente "72 horas = 3 días"
   - El sistema lo hace por ti

3. **Compatibilidad** 🔄
   - Los eventos existentes siguen funcionando
   - No se pierde ninguna información
   - Migración sin impacto

4. **Escalabilidad** 📈
   - Soporta eventos hasta 30 días
   - Fácil de extender en el futuro (semanas, meses, etc.)

## 🐛 Solución de Problemas

### La columna duration_unit no existe

**Solución**: Ejecuta la migración en Supabase (Paso 1)

### Los eventos muestran duración incorrecta

**Síntomas**: Un evento de 2 días muestra "48 horas"

**Causa**: La columna `duration_unit` no tiene el valor correcto

**Solución**: Actualiza el evento manualmente:
```sql
UPDATE events_workshops 
SET duration_unit = 'days'
WHERE id = 'TU_EVENT_ID_AQUI'
AND duration_hours >= 24;
```

### El selector de unidad no aparece

**Causa**: El frontend no está actualizado

**Solución**: 
```bash
git pull origin main
pnpm build
# O si estás en dev
pnpm dev
```

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que la migración se aplicó correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de tener la última versión del código

---

**Fecha de actualización**: 24 de octubre de 2025  
**Versión de migración**: 58

