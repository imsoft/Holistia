# 🔧 Corrección del Sistema de Pago de Inscripción

## 📋 Problema Identificado

### Síntomas
- Un profesional (Jessica Alejandra Flores Valencia) fue aprobado pero no aparece como que ha pagado
- No se crearon registros en la tabla `payments` para tipo `registration`
- El sistema no estaba procesando correctamente los pagos de inscripción

### Causa Raíz
**Error en el endpoint `/api/stripe/registration-checkout`:**

El monto del pago se estaba guardando en **centavos** en lugar de en **pesos** en la base de datos, a diferencia de los pagos de citas y eventos que sí se guardan correctamente en pesos.

```typescript
// ❌ ANTES (INCORRECTO)
amount: amountInCents,  // Guardaba 100000 en vez de 1000.00
service_amount: amountInCents,
```

```typescript
// ✅ DESPUÉS (CORRECTO)
amount: registrationFeeAmount,  // Guarda 1000.00 correctamente
service_amount: registrationFeeAmount,
```

## ✅ Solución Aplicada

### Cambios Realizados

**Archivo:** `src/app/api/stripe/registration-checkout/route.ts`

- **Línea 66-67:** Cambiar `amountInCents` a `registrationFeeAmount` para consistencia con otros tipos de pago
- Los centavos (`amountInCents`) solo se usan para comunicación con Stripe API, no para la base de datos

### Flujo Correcto Ahora

1. **Frontend:** Usuario hace clic en "Pagar Inscripción"
2. **API Endpoint:** 
   - ✅ Valida autenticación y existencia de aplicación
   - ✅ Crea registro en `payments` con monto en **pesos** (1000.00)
   - ✅ Crea sesión de Stripe con monto en **centavos** (100000)
   - ✅ Guarda `stripe_session_id` en ambas tablas
3. **Stripe:** Usuario completa el pago
4. **Webhook:** 
   - ✅ Actualiza `payments.status = 'succeeded'`
   - ✅ Actualiza `professional_applications.registration_fee_paid = TRUE`
   - ✅ Establece `registration_fee_expires_at` a 1 año desde hoy

## 📊 Verificación

### Queries para Verificar el Fix

```sql
-- 1. Ver pagos de inscripción (debería mostrar montos en pesos, no centavos)
SELECT 
  id,
  patient_id,
  amount,
  service_amount,
  currency,
  status,
  created_at
FROM payments
WHERE payment_type = 'registration'
ORDER BY created_at DESC;

-- 2. Ver aplicaciones pendientes de pago
SELECT 
  id,
  first_name,
  last_name,
  email,
  status,
  registration_fee_paid,
  registration_fee_amount,
  registration_fee_stripe_session_id
FROM professional_applications
WHERE registration_fee_paid = FALSE
  AND status = 'approved'
ORDER BY created_at DESC;
```

### Casos de Prueba

#### ✅ Caso 1: Nuevo profesional paga inscripción
1. Profesional se registra
2. Admin aprueba la aplicación
3. Profesional hace clic en "Pagar Inscripción"
4. **Verificar:** Se crea registro en `payments` con `amount = 1000.00`
5. Profesional completa pago en Stripe
6. **Verificar:** `registration_fee_paid = TRUE` y `expires_at` es 1 año desde hoy

#### ✅ Caso 2: Profesional renueva inscripción expirada
1. Profesional con inscripción expirada
2. Hace clic en "Renovar Inscripción"
3. **Verificar:** Se crea nuevo registro en `payments` con `amount = 1000.00`
4. Completa pago
5. **Verificar:** `registration_fee_expires_at` actualizado a 1 año desde hoy

## 🚨 Acción Requerida

### Para Jessica Alejandra Flores Valencia

Su aplicación fue aprobada pero **no ha realizado el pago** de inscripción. Para que aparezca en la plataforma debe:

1. Ir a: `/patient/[su-id]/explore/become-professional`
2. Verá un mensaje: "Pago de Inscripción Requerido"
3. Hacer clic en "Pagar Inscripción"
4. Completar el pago de $1,000 MXN en Stripe

**Estado actual:**
- ✅ Aplicación aprobada
- ❌ Inscripción NO pagada
- ❌ NO visible en la plataforma

## 📅 Historial

- **23/10/2025:** Se identificó y corrigió el error en el endpoint de pago
- **Impacto:** Solo afecta a nuevos profesionales registrados desde la implementación del sistema de pago (22/10/2025)
- **Profesionales existentes:** No afectados - se les otorgó 1 año gratis hasta 22/10/2026

## 🔍 Monitoreo

### Logs a Revisar

```bash
# Ver logs de Stripe API
https://dashboard.stripe.com/test/logs

# Ver logs de Supabase
Supabase Dashboard > Logs > API
```

### Métricas a Monitorear

1. **Tasa de conversión de pago:** % de profesionales aprobados que completan el pago
2. **Tiempo promedio para pagar:** Desde aprobación hasta pago completado
3. **Errores en checkout:** Monitorear logs de `/api/stripe/registration-checkout`
4. **Webhooks fallidos:** Revisar logs de Stripe para webhooks no procesados

## 📝 Notas Adicionales

- El pago de inscripción es **anual** y debe renovarse cada año
- Los profesionales reciben recordatorios a los 30, 15 y 7 días antes de expirar
- Sin pago activo, el profesional NO aparece en el listado público
- Los administradores pueden ver todos los profesionales sin importar estado de pago

