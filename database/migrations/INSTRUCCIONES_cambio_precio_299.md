# 💰 Actualizar Precio de Inscripción de $600 a $299 MXN

## 📋 Problema Reportado

Profesionales que están **a mitad del proceso** de registro o que **NO han pagado** reportan que el sistema les muestra **$600 MXN** o **$1000 MXN** en lugar del nuevo precio de **$299 MXN**.

## 🔍 Causa del Problema

La migración `124_update_registration_fee_to_299.sql` solo actualizó el valor **por defecto** para nuevos registros, pero NO actualizó los registros existentes de profesionales que ya estaban en la plataforma.

### Montos Encontrados en la Base de Datos:
- **$299 MXN**: 8 profesionales (correcto) ✅
- **$1000 MXN**: 27 profesionales (precio muy antiguo) ❌
- **$600 MXN**: Posiblemente algunos profesionales ❌
- **NULL**: Profesionales que empezaron el proceso pero no lo completaron ❌

### Ubicaciones donde se muestra el precio:

1. **Página de renovación** (`/patient/[id]/explore/become-professional`)
   - Línea 1242: Muestra el monto en el card de pago
   - Línea 1304: Mensaje de inscripción expirada
   - Línea 1331: Mensaje de cuota pendiente

2. **API de Stripe Checkout** (`/api/stripe/registration-checkout/route.ts`)
   - Línea 85: Lee `registration_fee_amount` de la aplicación (con fallback a 299 si es null)

El problema es que los profesionales existentes tienen diferentes valores en `registration_fee_amount`:
- Algunos tienen `600` (precio intermedio)
- Otros tienen `1000` (precio muy antiguo)
- Algunos tienen `NULL` (no completaron el registro)

Todos deben actualizarse a `299`.

---

## ✅ Solución

### Paso 1: Ejecutar el Script SQL

1. Ve al **SQL Editor** de Supabase
2. Ejecuta el archivo: [`EJECUTAR_actualizar_precio_inscripcion_299.sql`](./EJECUTAR_actualizar_precio_inscripcion_299.sql)

Este script:
- ✅ Mostrará el resumen actual de montos ($299, $600, $1000, NULL)
- ✅ Listará profesionales que NO tienen $299 y NO han pagado
- ✅ Actualizará SOLO a profesionales que NO han pagado a $299
- ✅ **Respetará** el monto de los que ya pagaron ($1000, $600, etc.)
- ✅ Verificará que la actualización fue exitosa
- ✅ Mostrará un resumen final separado por estado de pago

### Paso 2: Verificar el Resultado

Después de ejecutar el script, verifica:

#### A. En la Base de Datos
```sql
-- Debe devolver 0 profesionales SIN PAGAR con otros montos
SELECT COUNT(*) FROM professional_applications
WHERE (registration_fee_amount != 299.00 OR registration_fee_amount IS NULL)
  AND (registration_fee_paid = false OR registration_fee_paid IS NULL);

-- Ver resumen por estado de pago
SELECT
  registration_fee_amount,
  registration_fee_paid,
  COUNT(*) as total
FROM professional_applications
GROUP BY registration_fee_amount, registration_fee_paid
ORDER BY registration_fee_paid DESC, registration_fee_amount;
```

#### B. En la Aplicación
1. Pide a un profesional que entre a su página de renovación:
   ```
   https://www.holistia.io/patient/{user_id}/explore/become-professional
   ```
2. Verifica que el precio mostrado sea **$299 MXN**
3. Si intenta pagar, debe ver **$299 MXN** en Stripe Checkout

---

## 🎯 Resultado Esperado

### Antes:
```
Profesionales que YA PAGARON:
- registration_fee_amount = 1000.00, pagado = true  (mantener)
- registration_fee_amount = 299.00, pagado = true   (mantener)

Profesionales que NO HAN PAGADO:
- registration_fee_amount = 1000.00, pagado = false  (actualizar a 299)
- registration_fee_amount = 600.00, pagado = false   (actualizar a 299)
- registration_fee_amount = NULL, pagado = false     (actualizar a 299)
```

### Después:
```
Profesionales que YA PAGARON:
- registration_fee_amount = 1000.00, pagado = true  ✅ (no se toca)
- registration_fee_amount = 299.00, pagado = true   ✅ (no se toca)

Profesionales que NO HAN PAGADO:
- registration_fee_amount = 299.00, pagado = false  ✅ (todos actualizados)
```

**Resultado:**
- Los que ya pagaron mantienen su monto histórico para referencia
- Los que NO han pagado verán $299 MXN al intentar pagar

---

## 📊 Información Adicional

### ¿Esto afectará a profesionales que ya pagaron $1000 o $600?

**No.** Esta actualización solo cambia el **monto mostrado** para futuros pagos o renovaciones. Los pagos históricos ($1000, $600, etc.) se mantienen en la tabla `payments` y no se modifican.

### ¿Qué pasa con profesionales que pagaron $1000 pero aún no expira su inscripción?

No se les cobrará nada hasta que expire su inscripción. Cuando llegue el momento de renovar, se les cobrará el nuevo monto de $299 MXN.

### ¿Los profesionales que pagaron más recibirán algún beneficio?

Esta es una decisión de negocio. El script solo actualiza el precio técnico. Si decides:
- Dar meses adicionales de membresía
- Reembolsos parciales
- Descuentos futuros

Eso debe manejarse manualmente como políticas de negocio.


---

## 🔍 Archivos Relevantes

| Archivo | Descripción |
|---------|-------------|
| [`EJECUTAR_actualizar_precio_inscripcion_299.sql`](./EJECUTAR_actualizar_precio_inscripcion_299.sql) | Script SQL para actualizar precios |
| [`124_update_registration_fee_to_299.sql`](./124_update_registration_fee_to_299.sql) | Migración original (solo actualizó default) |
| [`src/app/(dashboard)/(patient)/patient/[id]/explore/become-professional/page.tsx`](../../src/app/(dashboard)/(patient)/patient/[id]/explore/become-professional/page.tsx) | Página donde se muestra el precio |
| [`src/app/api/stripe/registration-checkout/route.ts`](../../src/app/api/stripe/registration-checkout/route.ts) | API que crea el checkout de Stripe |

---

## ✅ Checklist de Verificación

Después de ejecutar el script, verifica:

- [ ] El script se ejecutó sin errores
- [ ] La consulta de verificación muestra 0 profesionales **SIN PAGAR** con montos diferentes a $299
- [ ] Los profesionales que **YA PAGARON** mantienen su monto histórico ($1000, etc.)
- [ ] Los profesionales que **NO HAN PAGADO** ahora tienen $299
- [ ] Un profesional sin pagar ve $299 en la página de renovación
- [ ] El checkout de Stripe muestra $299 para profesionales sin pagar
- [ ] Profesionales que estaban a mitad de proceso ahora ven $299

---

**Ejecuta el script SQL y verifica que los profesionales ahora vean $299 MXN.** 🚀