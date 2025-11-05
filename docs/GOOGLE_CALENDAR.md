# Guía Completa de Google Calendar - Holistia

Esta guía completa te ayudará a configurar y usar la integración de Google Calendar en Holistia para sincronizar automáticamente citas y eventos.

## Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Uso en la Aplicación](#uso-en-la-aplicación)
3. [Ejemplos de Uso](#ejemplos-de-uso)
4. [Troubleshooting](#troubleshooting)

---

## Configuración Inicial

### 1. Configurar Google Cloud Console

#### Paso 1.1: Crear un Proyecto

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos en la parte superior
3. Haz clic en "Nuevo Proyecto"
4. Nombre: `Holistia Calendar Integration`
5. Haz clic en "Crear"

#### Paso 1.2: Habilitar Google Calendar API

1. En el menú lateral, ve a **APIs y Servicios** > **Biblioteca**
2. Busca "Google Calendar API"
3. Haz clic en "Google Calendar API"
4. Haz clic en "Habilitar"

#### Paso 1.3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **APIs y Servicios** > **Pantalla de consentimiento de OAuth**
2. Selecciona tipo de usuario: **Externo**
3. Haz clic en "Crear"
4. Completa la información:
   - **Nombre de la aplicación**: Holistia
   - **Correo de asistencia**: tu-email@ejemplo.com
   - **Logo de la aplicación**: (opcional)
   - **Dominio de la aplicación**: https://holistia.io
   - **Dominios autorizados**: holistia.io
   - **Información de contacto del desarrollador**: tu-email@ejemplo.com
5. Haz clic en "Guardar y Continuar"

#### Alcances (Scopes)

1. Haz clic en "Agregar o quitar alcances"
2. Agrega el siguiente alcance:
   - `https://www.googleapis.com/auth/calendar`
3. Haz clic en "Guardar y Continuar"
4. Completa los pasos restantes (usuarios de prueba, resumen)

#### Paso 1.4: Crear Credenciales OAuth 2.0

1. Ve a **APIs y Servicios** > **Credenciales**
2. Haz clic en "Crear credenciales" > "ID de cliente de OAuth 2.0"
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `Holistia Calendar Client`
5. **URI de redirección autorizados**:
   - Desarrollo: `http://localhost:3000/api/google-calendar/callback`
   - Producción: `https://holistia.io/api/google-calendar/callback`
6. Haz clic en "Crear"
7. **Copia el Client ID y Client Secret** (los necesitarás después)

### 2. Configurar Variables de Entorno

Agrega estas variables a tu `.env.local`:

```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# En producción, usa:
# GOOGLE_REDIRECT_URI=https://holistia.io/api/google-calendar/callback
```

### 3. Ejecutar Migración de Base de Datos

La migración `40_add_integrations.sql` ya incluye las columnas necesarias para Google Calendar:

- `profiles.google_calendar_connected`
- `profiles.google_access_token`
- `profiles.google_refresh_token`
- `profiles.google_token_expires_at`
- `profiles.google_calendar_id`
- `appointments.google_calendar_event_id`
- `events_workshops.google_calendar_event_id`

Si no la has ejecutado, ejecuta la migración en Supabase SQL Editor.

---

## Uso en la Aplicación

### Componente de Integración

El componente `GoogleCalendarIntegration` está disponible para usar en páginas de configuración:

```tsx
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';

<GoogleCalendarIntegration userId={user.id} />
```

Este componente permite:
- Ver estado de conexión
- Conectar/desconectar Google Calendar
- Sincronización manual de eventos

### Server Actions

Disponibles en `src/actions/google-calendar/`:

#### Para Citas:
- `createAppointmentInGoogleCalendar()` - Crea evento de cita
- `updateAppointmentInGoogleCalendar()` - Actualiza evento
- `deleteAppointmentFromGoogleCalendar()` - Elimina evento
- `syncAllAppointmentsToGoogleCalendar()` - Sincroniza todas las citas

#### Para Eventos/Talleres:
- `createEventWorkshopInGoogleCalendar()` - Crea evento de taller
- `updateEventWorkshopInGoogleCalendar()` - Actualiza evento
- `deleteEventWorkshopFromGoogleCalendar()` - Elimina evento
- `syncAllEventsToGoogleCalendar()` - Sincroniza todos los eventos

---

## Ejemplos de Uso

Ver el documento completo: [`GOOGLE_CALENDAR_USAGE_EXAMPLES.md`](./GOOGLE_CALENDAR_USAGE_EXAMPLES.md)

### Ejemplo Básico: Agregar Componente a Settings

```tsx
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';

export default function SettingsPage() {
  return (
    <section>
      <h2>Integraciones</h2>
      <GoogleCalendarIntegration userId={user.id} />
    </section>
  );
}
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problema:** La URI de redirección no coincide.

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Verifica que las URIs de redirección incluyan:
   - `http://localhost:3000/api/google-calendar/callback` (desarrollo)
   - `https://holistia.io/api/google-calendar/callback` (producción)

### Error: "invalid_grant"

**Problema:** El token de refresh expiró o es inválido.

**Solución:**
1. Desconecta la cuenta de Google Calendar
2. Vuelve a conectar
3. Esto generará nuevos tokens

### Eventos No Aparecen en Google Calendar

**Verificaciones:**
1. Verifica que la cuenta esté conectada:
   ```sql
   SELECT google_calendar_connected FROM profiles WHERE id = 'user_id';
   ```
2. Verifica que los tokens no hayan expirado
3. Revisa los logs de la aplicación para errores
4. Verifica que el `google_calendar_event_id` se guarde correctamente

### Sincronización Automática No Funciona

**Verificaciones:**
1. Los eventos se crean automáticamente cuando:
   - Se paga una cita (webhook de Stripe)
   - Se crea un evento/taller
2. Verifica que los webhooks estén configurados correctamente
3. Revisa los logs de Stripe para ver si el webhook se dispara

---

## Estado de la Integración

### ✅ Completado

- [x] Configuración de OAuth 2.0
- [x] Creación de eventos de citas
- [x] Actualización de eventos
- [x] Eliminación de eventos
- [x] Sincronización manual
- [x] Componente de integración UI
- [x] Migración de base de datos

### ⏳ Pendiente

- [ ] Sincronización automática en webhooks
- [ ] Sincronización bidireccional (calendario → Holistia)
- [ ] Manejo de conflictos de tiempo
- [ ] Notificaciones de cambios

---

## Recursos

- [Ejemplos de Uso](./GOOGLE_CALENDAR_USAGE_EXAMPLES.md)
- [Google Calendar API Docs](https://developers.google.com/calendar/api/v3/reference)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)

