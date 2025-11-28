# Sincronización Bidireccional con Google Calendar

Esta guía explica cómo funciona la sincronización bidireccional entre Holistia y Google Calendar, permitiendo que los eventos creados en Google Calendar aparezcan como bloqueados en la plataforma.

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Cómo Funciona](#cómo-funciona)
3. [Configuración](#configuración)
4. [Uso para Profesionales](#uso-para-profesionales)
5. [Detalles Técnicos](#detalles-técnicos)
6. [Troubleshooting](#troubleshooting)

---

## Introducción

La sincronización bidireccional permite:

✅ **Holistia → Google Calendar:**
- Las citas confirmadas en Holistia se crean automáticamente en Google Calendar
- Los eventos/talleres se sincronizan con Google Calendar
- Las actualizaciones y cancelaciones se reflejan en Google Calendar

✅ **Google Calendar → Holistia:**
- Los eventos creados directamente en Google Calendar aparecen como **bloqueados** en la disponibilidad de Holistia
- Los usuarios no pueden reservar citas en esos horarios
- Los eventos se sincronizan automáticamente mediante webhooks
- La sincronización se puede hacer manualmente con un botón

---

## Cómo Funciona

### Flujo de Sincronización desde Google Calendar

```
1. Profesional crea evento en Google Calendar
   ↓
2. Google envía notificación webhook a Holistia
   ↓
3. Holistia obtiene eventos de Google Calendar
   ↓
4. Filtra eventos que NO son citas de Holistia
   ↓
5. Crea bloques de disponibilidad automáticamente
   ↓
6. Los usuarios ven esos horarios como "bloqueados"
```

### Tipos de Eventos que se Bloquean

- ✅ Eventos con hora específica (ej: 10:00 - 11:00)
- ✅ Eventos de día completo
- ✅ Eventos recurrentes
- ❌ Eventos marcados como "transparente" (libre en el calendario)
- ❌ Eventos que son citas creadas desde Holistia (para evitar duplicados)

---

## Configuración

### Paso 1: Ejecutar la Migración de Base de Datos

Ejecuta la migración `120_add_google_calendar_sync_fields.sql` en Supabase:

```sql
-- Esta migración agrega:
-- - Campos para almacenar información de suscripción a webhooks
-- - Campo is_external_event en availability_blocks
-- - Índices para búsqueda optimizada
```

### Paso 2: Configurar Webhook URL en Google Cloud Console

**IMPORTANTE:** El webhook debe ser HTTPS en producción.

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto Holistia
3. Ve a **APIs y Servicios** > **Credenciales**
4. Verifica que la URL del webhook esté permitida:
   ```
   https://tudominio.com/api/google-calendar/webhook
   ```

### Paso 3: Conectar Google Calendar desde la Plataforma

Los profesionales deben:

1. Ir a su página de configuración
2. En la sección "Integración con Google Calendar"
3. Hacer clic en "Conectar Google Calendar"
4. Autorizar los permisos necesarios

---

## Uso para Profesionales

### Sincronizar Eventos Manualmente

Desde la interfaz de Google Calendar Integration:

1. **Enviar a Google:** Sincroniza tus citas de Holistia → Google Calendar
2. **Importar de Google:** Sincroniza eventos de Google Calendar → Holistia (bloques)

### Sincronización Automática

Una vez conectado, el sistema:

1. **Activa automáticamente** la suscripción a webhooks
2. **Recibe notificaciones** cuando hay cambios en Google Calendar
3. **Sincroniza automáticamente** los eventos nuevos/modificados/eliminados
4. **Renueva la suscripción** automáticamente cada 6 días (Google Calendar limita a 7 días máximo)

### Ver Eventos Bloqueados

Los eventos importados de Google Calendar:

- ✅ Aparecen como horarios "bloqueados" en el calendario de disponibilidad
- ✅ Los usuarios NO pueden reservar citas en esos horarios
- ✅ Se marcan con el título del evento de Google Calendar
- ✅ Se actualizan automáticamente si se modifican en Google Calendar
- ✅ Se eliminan automáticamente si se eliminan en Google Calendar

---

## Detalles Técnicos

### Arquitectura

```
┌─────────────────┐
│ Google Calendar │
└────────┬────────┘
         │ Webhook Notification
         ↓
┌─────────────────────────────┐
│ /api/google-calendar/webhook│
└────────┬────────────────────┘
         │ Trigger Sync
         ↓
┌─────────────────────────────┐
│ syncGoogleCalendarEvents()  │
└────────┬────────────────────┘
         │
         ├→ Obtener eventos de Google Calendar
         │
         ├→ Filtrar eventos externos (no de Holistia)
         │
         ├→ Crear availability_blocks con is_external_event=true
         │
         └→ Eliminar bloques de eventos ya no existentes
```

### Base de Datos

#### Tabla `profiles` - Nuevos Campos

```sql
google_calendar_channel_id      TEXT       -- ID del canal de notificaciones
google_calendar_resource_id     TEXT       -- ID del recurso observado
google_calendar_sync_token      TEXT       -- Token para sync incremental
google_calendar_webhook_expiration TIMESTAMPTZ -- Expiración del webhook
```

#### Tabla `availability_blocks` - Nuevos Campos

```sql
is_external_event       BOOLEAN    -- TRUE si viene de Google Calendar
external_event_source   TEXT       -- 'google_calendar'
external_event_metadata JSONB      -- Metadata del evento (summary, description, etc.)
```

### Server Actions

#### `syncGoogleCalendarEvents(userId: string)`
- Obtiene eventos de Google Calendar
- Filtra eventos externos (no de Holistia)
- Crea bloques de disponibilidad
- Elimina bloques obsoletos

#### `subscribeToCalendarNotifications(userId: string)`
- Activa la suscripción a webhooks de Google Calendar
- Guarda información de la suscripción en la BD
- Expira en 6 días (se debe renovar)

#### `unsubscribeFromCalendarNotifications(userId: string)`
- Cancela la suscripción a webhooks
- Limpia información de la BD

#### `clearExternalGoogleCalendarBlocks(userId: string)`
- Elimina todos los bloques externos de un profesional
- Útil para limpieza o debugging

### Webhook Endpoint

**Ruta:** `/api/google-calendar/webhook`

**Headers recibidos de Google:**
```
x-goog-channel-id      - ID del canal
x-goog-resource-id     - ID del recurso
x-goog-resource-state  - Estado: 'sync' (cambios) o 'exists' (verificación)
x-goog-message-number  - Número secuencial del mensaje
```

**Respuesta:** Siempre `200 OK` (procesamiento asíncrono)

---

## Troubleshooting

### Los eventos de Google Calendar no aparecen bloqueados

**Verificaciones:**

1. **¿Está conectado Google Calendar?**
   ```sql
   SELECT google_calendar_connected
   FROM profiles
   WHERE id = 'user_id';
   ```

2. **¿Hay suscripción activa?**
   ```sql
   SELECT
     google_calendar_channel_id,
     google_calendar_webhook_expiration
   FROM profiles
   WHERE id = 'user_id';
   ```

3. **¿El webhook está expirado?**
   - Si `google_calendar_webhook_expiration` < NOW(), renovar suscripción
   - Hacer clic en "Importar de Google" para renovar

4. **¿Se crearon los bloques?**
   ```sql
   SELECT *
   FROM availability_blocks
   WHERE professional_id = 'prof_id'
     AND is_external_event = true;
   ```

### Webhook no recibe notificaciones

**Verificaciones:**

1. **La URL debe ser HTTPS en producción**
   - Google Calendar NO envía webhooks a URLs HTTP (excepto localhost)

2. **Verificar logs del servidor**
   ```bash
   # Buscar en logs
   grep "Webhook de Google Calendar recibido" logs.txt
   ```

3. **Verificar que el canal esté activo**
   - La suscripción expira cada 6-7 días
   - Se debe renovar automáticamente

4. **Verificar permisos de Google Calendar API**
   - Scope requerido: `https://www.googleapis.com/auth/calendar`

### Eventos duplicados

Si un evento aparece dos veces (como cita Y como bloque):

**Causa:** El sistema no detectó que el evento es una cita de Holistia

**Solución:**
```sql
-- Verificar que las citas tengan google_calendar_event_id
SELECT id, google_calendar_event_id
FROM appointments
WHERE professional_id = 'prof_id'
  AND google_calendar_event_id IS NULL;

-- Si faltan event_ids, sincronizar de nuevo
-- Desde la UI: Click en "Enviar a Google"
```

### Limpiar todos los bloques externos

Si necesitas empezar de cero:

```sql
-- CUIDADO: Esto eliminará TODOS los bloques externos del profesional
DELETE FROM availability_blocks
WHERE professional_id = 'prof_id'
  AND is_external_event = true;
```

O usar el server action:
```typescript
await clearExternalGoogleCalendarBlocks(userId);
```

---

## Limitaciones Conocidas

1. **Webhook expira cada 6-7 días**
   - Se debe renovar periódicamente
   - Consideramos implementar un cron job para renovación automática

2. **No se sincronizan eventos del pasado**
   - Solo eventos futuros (próximos 30 días)

3. **Eventos transparentes no se bloquean**
   - Si el evento está marcado como "libre" en Google Calendar, no se bloquea

4. **Sincronización inicial es manual**
   - El profesional debe hacer clic en "Importar de Google" la primera vez

---

## Próximos Pasos

- [ ] Implementar renovación automática de webhooks con cron job
- [ ] Agregar sincronización de cambios de eventos (no solo creación/eliminación)
- [ ] Permitir configurar qué calendarios sincronizar (si el profesional tiene múltiples)
- [ ] Agregar opción para desactivar sincronización automática

---

## Recursos

- [Google Calendar Push Notifications](https://developers.google.com/calendar/api/guides/push)
- [Google Calendar Events API](https://developers.google.com/calendar/api/v3/reference/events)
- [Código: syncGoogleCalendarEvents](../src/actions/google-calendar/sync.ts)
- [Código: Webhook endpoint](../src/app/api/google-calendar/webhook/route.ts)
