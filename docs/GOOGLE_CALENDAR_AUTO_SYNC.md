# Sincronización Automática de Google Calendar

Este documento explica cómo funciona la sincronización automática bidireccional entre Holistia y Google Calendar.

## 🔄 Sincronizaciones Automáticas Implementadas

### 1. **Holistia → Google Calendar** (Automático)

Cuando se crea una cita en Holistia, se sincroniza automáticamente a Google Calendar del profesional:

#### a) Citas Pagadas por Pacientes
- **Trigger**: Webhook de Stripe cuando el pago es exitoso
- **Archivo**: `src/app/api/stripe/webhook/route.ts` (línea 556)
- **Flujo**:
  1. Usuario paga la cita
  2. Stripe envía webhook `checkout.session.completed`
  3. Se crea el evento en Google Calendar del profesional
  4. Se guarda el `google_calendar_event_id` en la tabla `appointments`

#### b) Citas Creadas Manualmente por Profesionales
- **Trigger**: Al crear cita en CreateAppointmentDialog
- **Archivo**: `src/components/appointments/create-appointment-dialog.tsx` (línea 202)
- **Flujo**:
  1. Profesional crea cita manual en su dashboard
  2. Se llama al endpoint `/api/google-calendar/sync-appointment`
  3. Se crea el evento en Google Calendar
  4. Se guarda el `google_calendar_event_id` en la tabla `appointments`

#### c) Confirmación de Citas
- **Trigger**: Cuando el profesional confirma una cita
- **Archivo**: `src/app/api/appointments/confirm/route.ts` (línea 148)
- **Flujo**:
  1. Profesional confirma la cita
  2. Si no tiene `google_calendar_event_id`, se sincroniza
  3. Se crea el evento en Google Calendar

### 2. **Google Calendar → Holistia** (Automático)

Cuando el profesional crea un evento en Google Calendar, se bloquea el horario en Holistia:

#### a) Sincronización en Tiempo Real (Webhook)
- **Trigger**: Webhook de Google Calendar
- **Archivo**: `src/app/api/google-calendar/webhook/route.ts`
- **Flujo**:
  1. Profesional crea/modifica evento en Google Calendar
  2. Google envía notificación al webhook
  3. Se ejecuta `syncGoogleCalendarEvents()`
  4. Se crean `availability_blocks` para eventos externos
  5. Esos horarios aparecen bloqueados en Holistia

#### b) Sincronización Periódica (Cron Job)
- **Trigger**: Cada 15 minutos (configurable)
- **Archivo**: `src/app/api/cron/sync-google-calendar/route.ts`
- **Configuración**: `vercel.json` (línea 12)
- **Schedule**: `*/15 * * * *` (cada 15 minutos)
- **Flujo**:
  1. Cron job se ejecuta automáticamente
  2. Obtiene todos los profesionales con Google Calendar conectado
  3. Para cada profesional, ejecuta `syncGoogleCalendarEvents()`
  4. Sincroniza eventos de los próximos 30 días
  5. Crea/actualiza `availability_blocks`

## 🚫 Validación de Disponibilidad (Automático)

El sistema valida automáticamente que no se puedan hacer reservas en horarios bloqueados:

### a) En la UI del Calendario
- **Archivo**: `src/hooks/use-schedule-availability.ts`
- Los horarios bloqueados por Google Calendar aparecen como "blocked"
- Los usuarios no pueden seleccionarlos

### b) En el Backend (Doble Validación)
- **Stripe Checkout**: `src/app/api/stripe/checkout/route.ts` (línea 87-145)
- **Citas Manuales**: `src/components/appointments/create-appointment-dialog.tsx` (línea 171-226)
- Valida contra `availability_blocks` antes de crear la cita
- Rechaza la creación si el horario está bloqueado

## 📋 Configuración Requerida

### Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Cron Job (opcional, para seguridad adicional)
CRON_SECRET=tu_secret_aleatorio_largo
```

### Configuración de Webhooks

#### Google Calendar Webhook
1. El webhook se registra automáticamente cuando el profesional conecta Google Calendar
2. URL del webhook: `https://tudominio.com/api/google-calendar/webhook`
3. Los canales expiran después de ~7 días y se renuevan automáticamente

#### Stripe Webhook
1. Configurar en Stripe Dashboard > Developers > Webhooks
2. URL: `https://tudominio.com/api/stripe/webhook`
3. Eventos: `checkout.session.completed`, `payment_intent.succeeded`, etc.
4. Agregar `STRIPE_WEBHOOK_SECRET` a las variables de entorno

### Configuración del Cron Job (Vercel) - OPCIONAL

**⚠️ IMPORTANTE**: Los cron jobs de Vercel requieren un plan **Pro o Enterprise**.

El endpoint del cron job está disponible en `/api/cron/sync-google-calendar` pero está **desactivado por defecto** en `vercel.json`.

Para activarlo cuando tengas un plan Pro/Enterprise, agrega esto a `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-google-calendar",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Si estás en el plan gratuito**: No te preocupes, la sincronización sigue funcionando perfectamente a través del **webhook de Google Calendar en tiempo real**. El cron job es solo un respaldo adicional.

## 🔍 Monitoreo y Debugging

### Logs del Cron Job
Para verificar que el cron job está funcionando:
1. Ve a Vercel Dashboard > Deployments > Functions
2. Busca `/api/cron/sync-google-calendar`
3. Revisa los logs para ver ejecuciones y resultados

### Testing Manual
Puedes probar el cron job manualmente:

```bash
# Desde tu terminal local
curl -X POST https://tudominio.com/api/cron/sync-google-calendar \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Verificar Estado de Sincronización
Revisa la tabla `availability_blocks` en Supabase:
- Eventos con `is_external_event = true` son de Google Calendar
- `external_event_source = 'google_calendar'`
- `google_calendar_event_id` contiene el ID del evento

## 📊 Flujo Completo de Sincronización

```
┌─────────────────────────────────────────────────────────────┐
│                   SINCRONIZACIÓN AUTOMÁTICA                  │
└─────────────────────────────────────────────────────────────┘

Google Calendar → Holistia:
┌──────────────────┐     ┌───────────────┐     ┌──────────────┐
│ Evento creado    │────▶│ Webhook       │────▶│ Availability │
│ en Google        │     │ notifica      │     │ block creado │
│ Calendar         │     │               │     │              │
└──────────────────┘     └───────────────┘     └──────────────┘
                              ▲
                              │
                         ┌────┴─────┐
                         │ Cron Job │
                         │ Cada 15  │
                         │ minutos  │
                         └──────────┘

Holistia → Google Calendar:
┌──────────────────┐     ┌───────────────┐     ┌──────────────┐
│ Cita creada      │────▶│ Sync API      │────▶│ Evento en    │
│ en Holistia      │     │ automática    │     │ Google Cal   │
│ (pago/manual)    │     │               │     │              │
└──────────────────┘     └───────────────┘     └──────────────┘

Validación:
┌──────────────────┐     ┌───────────────┐     ┌──────────────┐
│ Usuario intenta  │────▶│ UI + Backend  │────▶│ Rechaza si   │
│ reservar         │     │ valida blocks │     │ está         │
│                  │     │               │     │ bloqueado    │
└──────────────────┘     └───────────────┘     └──────────────┘
```

## ✅ Checklist de Verificación

- [ ] Variables de entorno configuradas
- [ ] Webhook de Stripe configurado
- [ ] Profesional ha conectado Google Calendar
- [ ] Webhook de Google Calendar registrado (automático)
- [ ] Cron job desplegado en Vercel (opcional)
- [ ] CRON_SECRET configurado (si usas el cron)
- [ ] Probado crear evento en Google Calendar → aparece bloqueado en Holistia
- [ ] Probado crear cita en Holistia → aparece en Google Calendar
- [ ] Probado intentar reservar horario bloqueado → rechazado

## 🆘 Problemas Comunes

### El webhook de Google Calendar no funciona
- Verifica que el canal esté activo en la tabla `profiles.google_calendar_channel_id`
- Los canales expiran después de ~7 días, se renuevan automáticamente
- Revisa los logs del webhook en Vercel

### Las citas no se sincronizan a Google Calendar
- Verifica que el profesional tenga `google_calendar_connected = true`
- Verifica que tenga tokens válidos en `google_access_token` y `google_refresh_token`
- Revisa los logs del webhook de Stripe o del endpoint de sincronización

### El cron job no funciona
- Verifica que estés en un plan de Vercel que soporte cron jobs (Pro/Enterprise)
- Revisa la configuración en `vercel.json`
- Verifica los logs del cron job en Vercel Dashboard

## 📚 Referencias

- [Google Calendar API Push Notifications](https://developers.google.com/calendar/api/guides/push)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
