# 💳 Marcar Pagos Externos de Inscripción

## 📋 Resumen

Script para marcar como pagados a los profesionales que pagaron su inscripción anual por fuera de la plataforma.

## 👥 Profesionales Afectados

1. ✅ **Andrea Olivares Lara** - `a.olivareslara@hotmail.com` - **YA PAGADO** (22 oct 2024)
2. ⏳ **Jessica Flores Valencia** - `jessflova@gmail.com` - **PENDIENTE**
3. ⏳ **María Jimena** - `lamistika.love@gmail.com` - **PENDIENTE**

## 🚀 Pasos para Ejecutar

### Paso 1: Abrir Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Holistia**
3. En el menú lateral, haz clic en **SQL Editor**

### Paso 2: Ejecutar el Script

Copia y pega el siguiente SQL en el editor y haz clic en **Run**:

```sql
-- ========================================================================
-- MARCAR PAGOS EXTERNOS - Jessica Flores Valencia y María Jimena
-- ========================================================================

-- 1️⃣ Verificar estado actual
SELECT 
  first_name || ' ' || last_name AS nombre_completo,
  email,
  status,
  registration_fee_paid AS pagado,
  registration_fee_paid_at AS fecha_pago,
  registration_fee_expires_at AS expira
FROM professional_applications
WHERE id IN (
  '2b595a8e-7a51-4802-a465-4ad0d2caf73e', -- Jessica
  '6ef82471-17ed-48c4-bab1-f8526040f538'  -- María Jimena
);

-- 2️⃣ Actualizar Jessica Flores Valencia
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE id = '2b595a8e-7a51-4802-a465-4ad0d2caf73e'
  AND registration_fee_paid = false;

-- 3️⃣ Actualizar María Jimena
UPDATE professional_applications
SET 
  registration_fee_paid = true,
  registration_fee_paid_at = NOW(),
  registration_fee_expires_at = NOW() + INTERVAL '1 year',
  registration_fee_amount = 1000.00,
  registration_fee_currency = 'mxn',
  updated_at = NOW()
WHERE id = '6ef82471-17ed-48c4-bab1-f8526040f538'
  AND registration_fee_paid = false;

-- 4️⃣ Verificar que se aplicaron los cambios
SELECT 
  first_name || ' ' || last_name AS nombre_completo,
  email,
  status,
  registration_fee_paid AS pagado,
  registration_fee_paid_at AS fecha_pago,
  registration_fee_expires_at AS expira
FROM professional_applications
WHERE id IN (
  '5ec3bf08-0d1b-46d6-88a6-98391d25c75b', -- Andrea (referencia)
  '2b595a8e-7a51-4802-a465-4ad0d2caf73e', -- Jessica
  '6ef82471-17ed-48c4-bab1-f8526040f538'  -- María Jimena
)
ORDER BY last_name, first_name;
```

### Paso 3: Verificar Resultados

Después de ejecutar el script, deberías ver en el paso 4:

```
┌──────────────────────────┬───────────────────────────┬──────────┬────────┬─────────────────────┬─────────────────────┐
│ nombre_completo          │ email                     │ status   │ pagado │ fecha_pago          │ expira              │
├──────────────────────────┼───────────────────────────┼──────────┼────────┼─────────────────────┼─────────────────────┤
│ Jessica Flores Valencia  │ jessflova@gmail.com       │ approved │ true   │ 2025-10-24 XX:XX    │ 2026-10-24 XX:XX    │
│ María Jimena             │ lamistika.love@gmail.com  │ approved │ true   │ 2025-10-24 XX:XX    │ 2026-10-24 XX:XX    │
│ Andrea Olivares Lara     │ a.olivareslara@hotmail.com│ approved │ true   │ 2025-10-22 XX:XX    │ 2026-10-22 XX:XX    │
└──────────────────────────┴───────────────────────────┴──────────┴────────┴─────────────────────┴─────────────────────┘
```

**Todos deben tener**:
- ✅ `status` = `approved`
- ✅ `pagado` = `true`
- ✅ `fecha_pago` = fecha actual
- ✅ `expira` = fecha actual + 1 año

## ✨ Qué hace este script

### Campos que actualiza:

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `registration_fee_paid` | `true` | Marca que pagó la inscripción |
| `registration_fee_paid_at` | `NOW()` | Fecha/hora actual del pago |
| `registration_fee_expires_at` | `NOW() + 1 year` | Expira en 1 año |
| `registration_fee_amount` | `1000.00` | Monto de $1,000 MXN |
| `registration_fee_currency` | `'mxn'` | Moneda mexicana |
| `updated_at` | `NOW()` | Actualiza timestamp |

### Condición de seguridad:

```sql
AND registration_fee_paid = false
```

Esta condición previene que se actualicen profesionales que ya tienen el pago marcado.

## 📊 Resultado Final

Una vez ejecutado, las 3 profesionales:

1. ✅ Aparecerán en el listado público de **Holistia**
2. ✅ Tendrán acceso completo a la plataforma
3. ✅ Su inscripción estará vigente por 1 año
4. ✅ Recibirán recordatorio de renovación 30 y 7 días antes de vencer

## 🔍 Verificación Adicional

Para verificar que aparecen en el listado público, ejecuta:

```sql
SELECT 
  first_name || ' ' || last_name AS nombre,
  email,
  profession,
  is_active,
  status,
  registration_fee_paid,
  registration_fee_expires_at > NOW() AS suscripcion_vigente
FROM professional_applications
WHERE 
  status = 'approved' 
  AND registration_fee_paid = true
  AND is_active = true
ORDER BY created_at DESC
LIMIT 20;
```

Las 3 profesionales deben aparecer con `suscripcion_vigente = true`.

## ⚠️ Notas Importantes

1. **Andrea Olivares Lara** ya estaba marcada como pagada desde el 22 de octubre
2. Solo **Jessica** y **María Jimena** necesitan la actualización
3. El script es seguro y solo actualiza registros que aún no están marcados como pagados
4. La fecha de expiración es 1 año desde HOY, no desde cuando crearon su cuenta
5. Si ejecutas el script múltiples veces, no hay problema (por la condición de seguridad)

## 📞 Soporte

Si tienes algún problema:

1. Verifica que los IDs sean correctos
2. Confirma que los profesionales están en `status = 'approved'`
3. Revisa los logs de Supabase para cualquier error

## 📝 Registro de Ejecución

```
Fecha de creación del script: 24 de octubre de 2025
Profesionales actualizados: Jessica Flores Valencia, María Jimena
Monto marcado: $1,000 MXN
Vigencia: 1 año desde la ejecución
```

---

**Archivo de script SQL**: `database/scripts/mark_external_payments.sql`

