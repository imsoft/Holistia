# 💰 Actualizar Precio de Inscripción de $299 a $888 MXN

## 📋 Objetivo

Actualizar el precio de inscripción de profesionales de **$299 MXN** a **$888 MXN**.

## 🔍 ¿Qué se actualizará?

### Montos Actuales en la Base de Datos:
- **$299 MXN**: Profesionales con el precio actual (se actualizará a $888) ✅
- **$1000 MXN**: Profesionales con precio antiguo que ya pagaron (se mantiene)
- **$600 MXN**: Profesionales con precio intermedio que ya pagaron (se mantiene)
- **NULL**: Profesionales que empezaron el proceso pero no lo completaron (se actualizará a $888) ✅

### Ubicaciones donde se actualiza el precio:

1. **API de Stripe Checkout** (`/api/stripe/registration-checkout/route.ts`)
   - Línea 85: Cambio de fallback de 299 a 888
   - Ahora usa `registration_fee_amount` con fallback a $888 si es null

2. **Base de Datos** (tabla `professional_applications`)
   - Actualización masiva de todos los profesionales que **NO han pagado**
   - Los que ya pagaron mantienen su monto histórico

---

## ✅ Solución

### Paso 1: Ejecutar el Script SQL

1. Ve al **SQL Editor** de Supabase
2. Ejecuta el archivo: [`EJECUTAR_actualizar_precio_inscripcion_888.sql`](./EJECUTAR_actualizar_precio_inscripcion_888.sql)

Este script:
- ✅ Mostrará el resumen actual de montos ($299, $600, $1000, NULL)
- ✅ Listará profesionales que NO tienen $888 y NO han pagado
- ✅ Actualizará SOLO a profesionales que NO han pagado a $888
- ✅ **Respetará** el monto de los que ya pagaron ($1000, $600, $299, etc.)
- ✅ Verificará que la actualización fue exitosa
- ✅ Mostrará un resumen final separado por estado de pago

### Paso 2: Verificar el Resultado

Después de ejecutar el script, verifica:

#### A. En la Base de Datos
```sql
-- Debe devolver 0 profesionales SIN PAGAR con otros montos
SELECT COUNT(*) FROM professional_applications
WHERE (registration_fee_amount != 888.00 OR registration_fee_amount IS NULL)
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
2. Verifica que el precio mostrado sea **$888 MXN**
3. Si intenta pagar, debe ver **$888 MXN** en Stripe Checkout

---

## 🎯 Resultado Esperado

### Antes:
```
Profesionales que YA PAGARON:
- registration_fee_amount = 1000.00, pagado = true  (mantener)
- registration_fee_amount = 600.00, pagado = true   (mantener)
- registration_fee_amount = 299.00, pagado = true   (mantener)

Profesionales que NO HAN PAGADO:
- registration_fee_amount = 299.00, pagado = false  (actualizar a 888)
- registration_fee_amount = NULL, pagado = false    (actualizar a 888)
```

### Después:
```
Profesionales que YA PAGARON:
- registration_fee_amount = 1000.00, pagado = true  ✅ (no se toca)
- registration_fee_amount = 600.00, pagado = true   ✅ (no se toca)
- registration_fee_amount = 299.00, pagado = true   ✅ (no se toca)

Profesionales que NO HAN PAGADO:
- registration_fee_amount = 888.00, pagado = false  ✅ (todos actualizados)
```

**Resultado:**
- Los que ya pagaron mantienen su monto histórico para referencia
- Los que NO han pagado verán $888 MXN al intentar pagar

---

## 📊 Información Adicional

### ¿Esto afectará a profesionales que ya pagaron $299, $600 o $1000?

**No.** Esta actualización solo cambia el **monto mostrado** para futuros pagos o renovaciones. Los pagos históricos se mantienen en la tabla `payments` y no se modifican.

### ¿Qué pasa con profesionales que pagaron $299 pero aún no expira su inscripción?

No se les cobrará nada hasta que expire su inscripción. Cuando llegue el momento de renovar, se les cobrará el nuevo monto de $888 MXN.

### ¿Los profesionales que pagaron menos recibirán algún beneficio?

Esta es una decisión de negocio. El script solo actualiza el precio técnico. Si decides:
- Dar meses adicionales de membresía
- Descuentos futuros
- Política de grandfathering (mantener precio anterior)

Eso debe manejarse manualmente como políticas de negocio.

---

## 🔍 Archivos Modificados

| Archivo | Descripción | Cambio |
|---------|-------------|--------|
| [`EJECUTAR_actualizar_precio_inscripcion_888.sql`](./EJECUTAR_actualizar_precio_inscripcion_888.sql) | Script SQL para actualizar precios | **NUEVO** |
| [`INSTRUCCIONES_cambio_precio_888.md`](./INSTRUCCIONES_cambio_precio_888.md) | Instrucciones de actualización | **NUEVO** |
| [`src/app/api/stripe/registration-checkout/route.ts`](../../src/app/api/stripe/registration-checkout/route.ts) | API de Stripe Checkout | Línea 85: `299.00` → `888.00` |

---

## ✅ Checklist de Verificación

Después de ejecutar el script, verifica:

- [ ] El script se ejecutó sin errores
- [ ] La consulta de verificación muestra 0 profesionales **SIN PAGAR** con montos diferentes a $888
- [ ] Los profesionales que **YA PAGARON** mantienen su monto histórico ($1000, $600, $299, etc.)
- [ ] Los profesionales que **NO HAN PAGADO** ahora tienen $888
- [ ] Un profesional sin pagar ve $888 en la página de renovación
- [ ] El checkout de Stripe muestra $888 para profesionales sin pagar
- [ ] Profesionales que estaban a mitad de proceso ahora ven $888

---

## 🚀 Pasos de Implementación

1. ✅ Actualizar código (route.ts) - **Ya completado**
2. ⏳ Ejecutar script SQL en Supabase - **Pendiente** (usar `EJECUTAR_actualizar_precio_inscripcion_888.sql`)
3. ⏳ Verificar en base de datos con queries de validación
4. ⏳ Probar en la aplicación con un profesional de prueba
5. ⏳ Actualizar emails de registro (opcional)

---

**Ejecuta el script SQL y verifica que los profesionales ahora vean $888 MXN.** 🚀
