# Scripts para Marcar Profesionales como Pagados

## Descripción
Estos scripts están diseñados para marcar como pagados a profesionales específicos que ya realizaron el pago de inscripción de $1,000 MXN.

## Profesionales a Actualizar
Basado en el JSON proporcionado:

1. **Cyntia Flores**
   - Email: `florescyntia09@gmail.com`
   - User ID: `c0d243bf-6941-4a11-b5c0-11b991363fdd`

2. **Esmeralda Garcia**
   - Email: `malama.espaciocreativo@gmail.com`
   - User ID: `d24ea208-4058-413e-89f3-22ca9e7c7589`

## Scripts Disponibles

### 1. `verify_professionals_exist.sql`
**Propósito**: Verificar que los profesionales existen en la base de datos antes de actualizarlos.

**Uso**: Ejecutar primero para confirmar que los datos son correctos.

### 2. `mark_professionals_as_paid.sql`
**Propósito**: Actualizar el estado de pago usando email y nombres.

**Campos actualizados**:
- `registration_fee_paid` → `TRUE`
- `registration_fee_amount` → `1000.00`
- `registration_fee_currency` → `'mxn'`
- `registration_fee_paid_at` → `NOW()`
- `updated_at` → `NOW()`

### 3. `mark_professionals_as_paid_by_user_id.sql`
**Propósito**: Actualizar el estado de pago usando los user_id (más seguro).

**Recomendado**: Este script es más seguro ya que usa IDs únicos.

### 4. `complete_mark_professionals_as_paid.sql`
**Propósito**: Script completo que incluye verificación, actualización y confirmación.

**Recomendado**: Este es el script más completo y seguro.

## Instrucciones de Ejecución

### Opción 1: Script Completo (Recomendado)
```sql
-- Ejecutar en Supabase SQL Editor
\i database/scripts/complete_mark_professionals_as_paid.sql
```

### Opción 2: Ejecución Paso a Paso
```sql
-- Paso 1: Verificar
\i database/scripts/verify_professionals_exist.sql

-- Paso 2: Actualizar (elegir uno)
\i database/scripts/mark_professionals_as_paid_by_user_id.sql
-- O
\i database/scripts/mark_professionals_as_paid.sql
```

## Verificación Post-Ejecución

Después de ejecutar cualquier script, puedes verificar los resultados con:

```sql
SELECT 
    first_name,
    last_name,
    email,
    registration_fee_paid,
    registration_fee_amount,
    registration_fee_paid_at,
    status
FROM professional_applications 
WHERE email IN (
    'florescyntia09@gmail.com',
    'malama.espaciocreativo@gmail.com'
);
```

## Campos Actualizados

Los siguientes campos se actualizarán en la tabla `professional_applications`:

| Campo | Valor | Descripción |
|-------|-------|-------------|
| `registration_fee_paid` | `TRUE` | Indica que el profesional pagó |
| `registration_fee_amount` | `1000.00` | Monto de la cuota de inscripción |
| `registration_fee_currency` | `'mxn'` | Moneda (pesos mexicanos) |
| `registration_fee_paid_at` | `NOW()` | Fecha y hora del pago |
| `updated_at` | `NOW()` | Fecha de última actualización |

## Notas Importantes

1. **Backup**: Siempre haz un backup antes de ejecutar scripts de actualización masiva.

2. **Verificación**: Ejecuta primero el script de verificación para confirmar que los datos son correctos.

3. **Transacciones**: Los scripts están diseñados para ser seguros, pero considera ejecutarlos en una transacción si es necesario.

4. **Logs**: El script completo incluye logs detallados del proceso.

## Troubleshooting

### Error: "No se encontraron todos los profesionales"
- Verifica que los emails y nombres coincidan exactamente
- Ejecuta el script de verificación primero

### Error: "Foreign key constraint"
- Verifica que la tabla `payments` existe
- Los campos de `payment_id` son opcionales

### Error: "Permission denied"
- Asegúrate de tener permisos de escritura en la tabla `professional_applications`
- Verifica las políticas RLS si aplican
