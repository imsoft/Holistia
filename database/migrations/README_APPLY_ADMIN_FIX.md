# Fix: Admin Dashboard - Contador de Pacientes y Finanzas

## Problema

El dashboard de admin mostraba:
- ❌ 0 pacientes para todos los profesionales
- ❌ 0 en todas las métricas financieras

## Causa

1. **Contador de Pacientes**: La consulta usaba `prof.user_id` en lugar de `prof.id` para buscar appointments
2. **Finanzas en 0**: El admin no tenía permisos RLS para leer la tabla `payments` y `appointments`

## Solución Aplicada

### 1. ✅ Código Corregido (Ya en GitHub)

Se corrigió el archivo `src/app/(dashboard)/(admin)/admin/[id]/professionals/page.tsx`:

```typescript
// ❌ ANTES
.eq('professional_id', prof.user_id);

// ✅ AHORA
.eq('professional_id', prof.id);
```

Además se agregó:
- Contador de pacientes del mes actual
- Contador de pacientes totales
- Mejor visualización en las cards

### 2. 🔧 Migración SQL Requerida

**IMPORTANTE**: Debes aplicar la migración `74_admin_can_read_appointments_and_payments.sql` en Supabase.

## Cómo Aplicar la Migración

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en "SQL Editor" en el menú lateral
3. Click en "New Query"
4. Copia y pega el contenido de `74_admin_can_read_appointments_and_payments.sql`
5. Click en "Run" (▶️)
6. Verifica que salga el mensaje de éxito

### Opción B: Desde CLI (Si tienes Supabase CLI)

```bash
# Asegúrate de estar autenticado
supabase login

# Aplica la migración
supabase db push --file database/migrations/74_admin_can_read_appointments_and_payments.sql
```

## Verificación

Después de aplicar la migración, verifica que funciona:

1. **Inicia sesión como admin** en la plataforma
2. Ve a **Admin Dashboard > Profesionales**
3. Verifica que:
   - ✅ Los profesionales muestren el número correcto de pacientes
   - ✅ Se vea "X pacientes totales" y "Y este mes"
4. Ve a **Admin Dashboard > Finanzas**
5. Verifica que:
   - ✅ Los números sean diferentes de 0
   - ✅ Se muestren los ingresos, comisiones, etc.

## Qué hace la migración

La migración crea dos políticas RLS:

1. **`Admins can view all appointments`**: Permite a usuarios admin leer todas las citas
2. **`Admins can view all payments`**: Permite a usuarios admin leer todos los pagos

Ambas políticas verifican que:
- El usuario esté autenticado
- El usuario sea de tipo `admin` en la tabla `profiles`
- La cuenta del admin esté activa (`account_active = true`)

## Rollback (Si algo sale mal)

Si necesitas revertir los cambios:

```sql
-- Eliminar las políticas creadas
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
```

## Archivos Modificados

- ✅ `src/app/(dashboard)/(admin)/admin/[id]/professionals/page.tsx`
- ✅ `database/migrations/74_admin_can_read_appointments_and_payments.sql` (NUEVO)

## Commits

- `8667ae1` - fix: corregir contador de pacientes en dashboard de admin
