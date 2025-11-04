# Guía de Configuración de Google Calendar

Esta guía te ayudará a configurar la integración de Google Calendar en Holistia para sincronizar automáticamente citas y eventos.

## Tabla de Contenidos

1. [Configurar Google Cloud Console](#1-configurar-google-cloud-console)
2. [Configurar Variables de Entorno](#2-configurar-variables-de-entorno)
3. [Ejecutar Migración de Base de Datos](#3-ejecutar-migración-de-base-de-datos)
4. [Probar la Integración](#4-probar-la-integración)
5. [Uso en la Aplicación](#5-uso-en-la-aplicación)

---

## 1. Configurar Google Cloud Console

### Paso 1.1: Crear un Proyecto

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en el selector de proyectos en la parte superior
3. Haz clic en "Nuevo Proyecto"
4. Nombre: `Holistia Calendar Integration`
5. Haz clic en "Crear"

### Paso 1.2: Habilitar Google Calendar API

1. En el menú lateral, ve a **APIs y Servicios** > **Biblioteca**
2. Busca "Google Calendar API"
3. Haz clic en "Google Calendar API"
4. Haz clic en "Habilitar"

### Paso 1.3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **APIs y Servicios** > **Pantalla de consentimiento de OAuth**
2. Selecciona tipo de usuario: **Externo**
3. Haz clic en "Crear"
4. Completa la información:
   - **Nombre de la aplicación**: Holistia
   - **Correo de asistencia**: tu-email@ejemplo.com
   - **Logo de la aplicación**: (opcional)
   - **Dominio de la aplicación**: https://tudominio.com
   - **Dominios autorizados**: tudominio.com
   - **Información de contacto del desarrollador**: tu-email@ejemplo.com
5. Haz clic en "Guardar y Continuar"

#### Alcances (Scopes)

1. Haz clic en "Agregar o quitar alcances"
2. Agrega el siguiente alcance:
   - `https://www.googleapis.com/auth/calendar`
   - Descripción: Ver, editar, compartir y eliminar permanentemente todos los calendarios a los que puedes acceder con Google Calendar
3. Haz clic en "Actualizar"
4. Haz clic en "Guardar y Continuar"

#### Usuarios de Prueba (Durante Desarrollo)

1. Agrega usuarios de prueba (tu email y el de otros desarrolladores)
2. Haz clic en "Guardar y Continuar"
3. Revisa el resumen y haz clic en "Volver al Panel"

### Paso 1.4: Crear Credenciales OAuth 2.0

1. Ve a **APIs y Servicios** > **Credenciales**
2. Haz clic en "+ Crear Credenciales"
3. Selecciona "ID de cliente de OAuth 2.0"
4. Tipo de aplicación: **Aplicación web**
5. Nombre: `Holistia Web Client`
6. **URIs de redireccionamiento autorizados**:
   - Desarrollo: `http://localhost:3000/api/google-calendar/callback`
   - Producción: `https://tudominio.com/api/google-calendar/callback`
7. Haz clic en "Crear"

### Paso 1.5: Guardar las Credenciales

Una vez creadas, verás una ventana con:
- **ID de cliente**: Algo como `123456789-abc...xyz.apps.googleusercontent.com`
- **Secreto del cliente**: Algo como `GOCSPX-abc...xyz`

**⚠️ IMPORTANTE**: Guarda estos valores de forma segura. Los necesitarás para el siguiente paso.

---

## 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

Para producción, en tu archivo `.env` o en las variables de entorno de Vercel:

```env
GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
GOOGLE_REDIRECT_URI=https://tudominio.com/api/google-calendar/callback
```

**⚠️ Seguridad**:
- NUNCA subas estas variables a Git
- Asegúrate de que `.env.local` esté en tu `.gitignore`
- En producción, usa variables de entorno seguras

---

## 3. Ejecutar Migración de Base de Datos

### Paso 3.1: Acceder a Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com/)
2. Haz clic en el icono de SQL Editor en el menú lateral

### Paso 3.2: Ejecutar la Migración

1. Copia el contenido completo de:
   ```
   database/migrations/40_add_google_calendar_integration.sql
   ```
2. Pégalo en el SQL Editor de Supabase
3. Haz clic en "Run" o presiona `Cmd/Ctrl + Enter`
4. Verifica que veas el mensaje de éxito:
   ```
   Migración de Google Calendar completada exitosamente
   ```

### Paso 3.3: Verificar las Columnas

Ejecuta este query para verificar que las columnas se crearon correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name LIKE 'google_%'
ORDER BY column_name;
```

Deberías ver:
- `google_calendar_connected` (boolean)
- `google_access_token` (text)
- `google_refresh_token` (text)
- `google_token_expires_at` (timestamp with time zone)
- `google_calendar_id` (text)

---

## 4. Probar la Integración

### Paso 4.1: Reiniciar el Servidor de Desarrollo

```bash
# Detener el servidor si está corriendo
# Ctrl + C

# Reiniciar
pnpm dev
```

### Paso 4.2: Probar la Conexión

1. Accede a tu aplicación en `http://localhost:3000`
2. Inicia sesión como **profesional**
3. Ve a Configuración (Settings)
4. Busca la sección "Integración con Google Calendar"
5. Haz clic en "Conectar Google Calendar"
6. Deberías ser redirigido a Google para autorizar
7. Acepta los permisos
8. Deberías volver a la aplicación con un mensaje de éxito

### Paso 4.3: Verificar en la Base de Datos

Ejecuta este query en Supabase SQL Editor:

```sql
SELECT id, email, google_calendar_connected, google_token_expires_at
FROM profiles
WHERE google_calendar_connected = true;
```

Deberías ver tu usuario con `google_calendar_connected = true`.

### Paso 4.4: Probar Sincronización

1. Crea una cita de prueba en Holistia
2. Confirma la cita
3. Ve a [Google Calendar](https://calendar.google.com/)
4. Deberías ver la cita sincronizada automáticamente

---

## 5. Uso en la Aplicación

### Para Profesionales

#### Conectar Google Calendar

1. Ve a tu Dashboard de Profesional
2. Haz clic en "Configuración" o "Settings"
3. Busca "Integración con Google Calendar"
4. Haz clic en "Conectar Google Calendar"
5. Autoriza los permisos en Google
6. ¡Listo! Tus citas se sincronizarán automáticamente

#### Sincronización Manual

Si ya tienes citas existentes antes de conectar Google Calendar:

1. Conecta tu cuenta de Google Calendar (paso anterior)
2. Haz clic en "Sincronizar ahora"
3. Todas tus citas futuras se agregarán a Google Calendar

#### Desconectar

1. Ve a Configuración
2. En la sección de Google Calendar
3. Haz clic en "Desconectar"
4. Confirma la acción

**⚠️ Nota**: Al desconectar, los eventos existentes en Google Calendar NO se eliminarán automáticamente.

### Sincronización Automática

Una vez conectado, las siguientes acciones se sincronizan automáticamente:

#### ✅ Crear Cita
- Cuando confirmas una cita, se crea automáticamente en Google Calendar
- Incluye: título, descripción, fecha/hora, ubicación, participantes

#### ✅ Actualizar Cita
- Cuando reprogramas una cita, se actualiza en Google Calendar
- Se mantiene el mismo evento, solo cambian los detalles

#### ✅ Cancelar Cita
- Cuando cancelas una cita, se elimina de Google Calendar
- El evento desaparece del calendario del profesional

#### ✅ Eventos y Talleres
- Los eventos que organizas también se sincronizan
- Incluye capacidad, precio, ubicación y detalles

---

## Componentes Creados

### API Routes

- `GET /api/google-calendar/auth` - Inicia el flujo OAuth
- `GET /api/google-calendar/callback` - Callback de OAuth
- `POST /api/google-calendar/disconnect` - Desconecta la cuenta
- `GET /api/google-calendar/status` - Verifica el estado de conexión

### Server Actions

- `createAppointmentInGoogleCalendar()` - Crea evento de cita
- `updateAppointmentInGoogleCalendar()` - Actualiza evento de cita
- `deleteAppointmentFromGoogleCalendar()` - Elimina evento de cita
- `listUserGoogleCalendarEvents()` - Lista eventos del usuario
- `syncAllAppointmentsToGoogleCalendar()` - Sincroniza todas las citas
- `createEventWorkshopInGoogleCalendar()` - Crea evento de taller
- `updateEventWorkshopInGoogleCalendar()` - Actualiza evento de taller
- `deleteEventWorkshopFromGoogleCalendar()` - Elimina evento de taller
- `syncAllEventsToGoogleCalendar()` - Sincroniza todos los eventos

### Componente UI

```tsx
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';

// En la página de configuración del profesional
<GoogleCalendarIntegration userId={user.id} />
```

---

## Solución de Problemas

### Error: "redirect_uri_mismatch"

**Problema**: La URI de redirección no coincide con las configuradas en Google Cloud Console.

**Solución**:
1. Ve a Google Cloud Console > Credenciales
2. Edita el ID de cliente OAuth
3. Verifica que la URI sea exactamente: `http://localhost:3000/api/google-calendar/callback` (desarrollo) o `https://tudominio.com/api/google-calendar/callback` (producción)
4. Guarda los cambios
5. Espera unos minutos para que se propaguen los cambios

### Error: "Access blocked: This app's request is invalid"

**Problema**: La pantalla de consentimiento OAuth no está configurada correctamente.

**Solución**:
1. Ve a Google Cloud Console > Pantalla de consentimiento de OAuth
2. Verifica que hayas completado todos los campos requeridos
3. Asegúrate de haber agregado el alcance `https://www.googleapis.com/auth/calendar`
4. Si estás en modo "Testing", agrega tu email a los usuarios de prueba

### Error: "Token expired"

**Problema**: El token de acceso expiró.

**Solución**: La aplicación debería refrescar automáticamente el token. Si no funciona:
1. Ve a Configuración
2. Desconecta Google Calendar
3. Vuelve a conectar

### Los eventos no se sincronizan

**Verificaciones**:
1. Verifica que estés conectado: Revisa el estado en Configuración
2. Revisa los logs del servidor: Busca errores relacionados con Google Calendar
3. Verifica las credenciales: Asegúrate de que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
4. Prueba sincronización manual: Haz clic en "Sincronizar ahora"

---

## Próximos Pasos (Opcional)

### Publicar la Aplicación

Para pasar de "Testing" a "Producción" en Google Cloud Console:

1. Ve a Pantalla de consentimiento de OAuth
2. Haz clic en "Publicar aplicación"
3. Google puede requerir verificación si solicitas alcances sensibles
4. El proceso de verificación puede tomar varios días

### Mejorar la Seguridad

1. **Encriptación de tokens**: Considera encriptar los tokens en la base de datos
2. **Rotación de tokens**: Implementa rotación automática de refresh tokens
3. **Auditoría**: Registra todas las operaciones de sincronización

### Funciones Adicionales

1. **Sincronización bidireccional**: Detectar cambios en Google Calendar y actualizarlos en Holistia
2. **Webhooks de Google Calendar**: Recibir notificaciones en tiempo real de cambios
3. **Múltiples calendarios**: Permitir elegir en qué calendario sincronizar
4. **Colores personalizados**: Categorizar eventos por tipo con colores

---

## Recursos

- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)

---

## Soporte

Si tienes problemas con la integración:

1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Consulta la documentación de Google Calendar API
4. Abre un issue en el repositorio

---

**¡Felicidades! 🎉** Has configurado exitosamente la integración de Google Calendar en Holistia.
