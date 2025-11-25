# Configuración del Sistema de Sincronización de Pagos

Este documento explica cómo asegurar que los pagos de inscripción se sincronicen correctamente.

## Problema Identificado

Algunos pagos de inscripción de profesionales se completaban en Stripe pero no se actualizaban en la base de datos debido a que el webhook no se ejecutaba correctamente.

## Soluciones Implementadas

### 1. Botón de Sincronización Manual

Ubicación: Panel de Admin > Profesionales > Botón "Sincronizar Pagos"

**Qué hace:** Verifica todos los pagos pendientes en Supabase contra Stripe y actualiza los que estén pagados.

**Cuándo usar:**
- Si notas que un profesional pagó pero sigue apareciendo como "Sin pagar"
- Después de cualquier incidente con el webhook

### 2. Cron Job Automático (Cada Hora)

**Qué hace:** Ejecuta automáticamente la sincronización cada hora para pagos de las últimas 48 horas.

**Configuración en Vercel:**

1. El cron job ya está configurado en `vercel.json`:
```json
{
  "path": "/api/cron/sync-pending-payments",
  "schedule": "0 * * * *"
}
```

2. **IMPORTANTE:** Agrega la variable de entorno en Vercel:
```
CRON_SECRET=tu_clave_secreta_aqui
```

**Cómo generar el secret:**
```bash
openssl rand -base64 32
```

3. Verifica en Vercel Dashboard > Settings > Crons que el job esté activo.

### 3. Endpoint de Diagnóstico

**URL:** `GET /api/admin/webhook-diagnostics`

**Qué hace:** Verifica la configuración del webhook en Stripe y detecta problemas.

**Cómo usar:**
```bash
curl https://www.holistia.io/api/admin/webhook-diagnostics \
  -H "Cookie: your-session-cookie"
```

## Verificación del Webhook en Stripe

### Eventos Requeridos

El webhook DEBE tener estos eventos habilitados:
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.succeeded`
- ✅ `charge.refunded`

### Cómo Verificar:

1. Ve a Stripe Dashboard > Developers > Webhooks
2. Busca el webhook de producción: `https://www.holistia.io/api/stripe/webhook`
3. Verifica que:
   - Estado: **Enabled**
   - Eventos: Los 5 eventos listados arriba
   - API Version: `2025-10-29.clover` (o la más reciente)

### Cómo Ver Intentos Fallidos:

1. En Stripe Dashboard > Developers > Webhooks > [Tu webhook]
2. Ve a la pestaña "Attempts"
3. Si hay errores, verás el detalle del problema

## Monitoreo Continuo

### Dashboard de Admin

- **Verde**: Profesionales con pago vigente
- **Amarillo**: Expira en menos de 30 días
- **Rojo**: Expirado o sin pagar
- **Gris**: Nunca ha pagado

### Logs a Revisar

En los logs de Vercel, busca:
```
✅ [Cron] Sincronización automática completada: X exitosos
🔵 [Sync] Iniciando sincronización de pagos de inscripción
```

## Troubleshooting

### Si un profesional pagó pero no se actualiza:

1. **Primero:** Usa el botón "Sincronizar Pagos" en el panel de admin
2. **Si persiste:** Verifica en Stripe que el pago existe y está `succeeded`
3. **Si el pago NO existe en Stripe:** El problema está en el checkout, no en el webhook
4. **Si el pago existe pero no sincroniza:** Revisa los logs del webhook en Stripe

### Si muchos pagos fallan:

1. Ejecuta el endpoint de diagnóstico
2. Verifica que el webhook esté habilitado
3. Revisa la configuración de `STRIPE_WEBHOOK_SECRET` en Vercel
4. Verifica que la URL del webhook sea correcta

## Mejores Prácticas

1. **Monitorea el dashboard de admin semanalmente** para detectar profesionales con "Sin pagar"
2. **Revisa los logs de Stripe** después de cada pago de inscripción
3. **Ejecuta el botón de sincronización** si notas inconsistencias
4. **El cron job automático** se encargará de la mayoría de casos

## Variables de Entorno Requeridas

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cron Job
CRON_SECRET=tu_clave_secreta_generada

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Contacto de Soporte

Si el problema persiste después de seguir estos pasos, contacta al equipo de desarrollo con:
- Screenshot del error
- ID del profesional afectado
- Session ID de Stripe (si está disponible)
- Logs relevantes
