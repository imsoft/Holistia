# Google Calendar para Profesionales - Guía Completa

## ✅ Funcionalidad ya implementada

La integración de Google Calendar está **completamente funcional** en Holistia. Aquí está todo lo que ya funciona:

## 🎯 ¿Qué se sincroniza automáticamente?

### Desde Holistia → Google Calendar

| Acción en Holistia | Qué sucede en Google Calendar |
|-------------------|-------------------------------|
| Crear cita | ✅ Se crea evento automáticamente |
| Confirmar cita | ✅ Se crea/actualiza evento |
| Reprogramar cita | ✅ Se actualiza fecha y hora del evento |
| Cancelar cita | ✅ Se elimina el evento |
| Crear evento/taller | ✅ Se crea evento |
| Actualizar evento/taller | ✅ Se actualiza evento |
| Cancelar evento/taller | ✅ Se elimina evento |

### Información sincronizada

Cada cita en Google Calendar incluye:
- **Título**: "Cita con [Nombre del Paciente]"
- **Fecha y Hora**: Según lo programado
- **Duración**: Según el servicio
- **Ubicación**: Dirección física o "Consulta en línea"
- **Descripción**:
  - Nombre del paciente
  - Email y teléfono
  - Tipo de consulta
  - Notas adicionales

---

## 🚀 Cómo Conectar tu Google Calendar (3 pasos)

### Paso 1: Ir a Configuración

En tu dashboard de profesional:
1. Haz clic en el menú lateral
2. Selecciona **"Configuración"** (última opción)
3. O ve directamente a: `/professional/[tu-id]/settings`

### Paso 2: Conectar Google Calendar

1. En la sección "Integraciones"
2. Encuentra la card de **"Google Calendar"**
3. Haz clic en **"Conectar Google Calendar"**
4. Se abrirá una ventana de Google
5. **Selecciona tu cuenta de Google**
6. **Acepta los permisos** que solicita Holistia
7. Serás redirigido de vuelta automáticamente

### Paso 3: Sincronizar tus citas existentes (opcional)

Si ya tienes citas creadas:
1. En la misma card de Google Calendar
2. Haz clic en **"Sincronizar Todas las Citas"**
3. Espera unos segundos
4. ¡Todas tus citas estarán en tu calendario!

---

## 💡 Uso Diario (Automático)

Una vez conectado, **no necesitas hacer nada más**. Todo funciona automáticamente:

### Desde el Dashboard de Profesionales

#### 1. Crear Cita Manual
```
Dashboard → Citas → Botón "Crear Cita"
→ Selecciona paciente, servicio, fecha y hora
→ Al crear, se sincroniza automáticamente a Google Calendar
```

#### 2. Confirmar Cita
```
Dashboard → Citas → Selecciona cita pendiente → "Confirmar"
→ Se actualiza en Google Calendar
```

#### 3. Reprogramar Cita
```
Dashboard → Citas → Selecciona cita → "Reprogramar"
→ Cambias fecha/hora
→ Se actualiza automáticamente en Google Calendar
```

#### 4. Cancelar Cita
```
Dashboard → Citas → Selecciona cita → "Cancelar"
→ Se elimina automáticamente de Google Calendar
```

### Desde Holistia Web (cuando paciente reserva)

Cuando un paciente reserva en línea:
```
Paciente reserva → Paga → Cita confirmada
→ Aparece automáticamente en tu Google Calendar
```

---

## 🔄 Sincronización en Tiempo Real

La sincronización ocurre:
- ✅ **Inmediatamente** después de cada acción
- ✅ **En segundo plano** (no bloquea la operación)
- ✅ **Sin intervención manual** requerida

Si la sincronización falla (sin conexión, token expirado, etc.):
- ✅ La cita en Holistia se guarda correctamente
- ⚠️ Solo no aparecerá en Google Calendar
- 💡 Puedes sincronizarla manualmente después

---

## 🛠️ Configuración Técnica (Ya está lista)

### Variables de Entorno Requeridas

Ya configuradas en el proyecto:
```bash
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=https://holistia.io/api/google-calendar/callback
```

### Migración de Base de Datos

La migración `40_add_integrations.sql` ya incluye:
- ✅ Tabla `profiles`: columnas para tokens de Google
- ✅ Tabla `appointments`: columna `google_calendar_event_id`
- ✅ Tabla `events_workshops`: columna `google_calendar_event_id`
- ✅ Índices optimizados
- ✅ Funciones de utilidad

### API Routes Implementadas

- ✅ `/api/google-calendar/auth` - Iniciar OAuth
- ✅ `/api/google-calendar/callback` - Callback OAuth
- ✅ `/api/google-calendar/disconnect` - Desconectar
- ✅ `/api/google-calendar/status` - Ver estado

### Server Actions Implementadas

**Para Citas:**
- ✅ `createAppointmentInGoogleCalendar()` - Integrado en confirm endpoint
- ✅ `updateAppointmentInGoogleCalendar()` - Integrado en reschedule endpoint
- ✅ `deleteAppointmentFromGoogleCalendar()` - Integrado en cancel endpoint
- ✅ `syncAllAppointmentsToGoogleCalendar()` - Disponible en UI

**Para Eventos:**
- ✅ `createEventWorkshopInGoogleCalendar()`
- ✅ `updateEventWorkshopInGoogleCalendar()`
- ✅ `deleteEventWorkshopFromGoogleCalendar()`
- ✅ `syncAllEventsToGoogleCalendar()`

---

## 📱 Dónde Aparece la Integración

### Para Profesionales

1. **Settings** (`/professional/[id]/settings`)
   - Card de Google Calendar
   - Botón "Conectar"/"Desconectar"
   - Botón "Sincronizar Todas las Citas"
   - Estado de conexión

---

## 🔐 Privacidad y Seguridad

- ✅ Solo accede a tu calendario (nada más de Google)
- ✅ Tokens almacenados de forma segura en Supabase
- ✅ Encriptación en tránsito
- ✅ Puedes desconectar en cualquier momento
- ✅ Los eventos solo los ves tú

---

## ❓ Preguntas Frecuentes

### ¿Mis pacientes verán los eventos en mi calendario?

**No.** Los eventos son privados. Solo tú puedes verlos en tu Google Calendar.

### ¿Se eliminarán eventos si desconecto?

**No.** Los eventos ya creados permanecen en tu calendario. Solo se detiene la sincronización futura.

### ¿Puedo editar los eventos desde Google Calendar?

**Sí**, puedes editarlos en Google Calendar, pero los cambios NO se reflejarán en Holistia. Recomendamos hacer todos los cambios desde Holistia para mantener sincronización.

### ¿Qué pasa si cambio algo en Google Calendar?

Los cambios hechos en Google Calendar **no se reflejan** en Holistia. La sincronización es unidireccional: Holistia → Google Calendar.

### ¿Funciona con Google Workspace (empresas)?

**Sí**, funciona perfectamente con cuentas de Google Workspace.

---

## 🆘 Soporte

**¿Problemas con la integración?**

Contacta a nuestro equipo: **hola@holistia.io**

---

## 📊 Estado de Implementación

| Funcionalidad | Estado |
|---------------|--------|
| Conectar cuenta | ✅ Implementado |
| Desconectar cuenta | ✅ Implementado |
| Crear cita → Calendar | ✅ Implementado |
| Confirmar cita → Calendar | ✅ Implementado |
| Reprogramar cita → Calendar | ✅ Implementado |
| Cancelar cita → Calendar | ✅ Implementado |
| Crear evento → Calendar | ✅ Implementado |
| Sincronización manual | ✅ Implementado |
| UI en settings | ✅ Implementado |
| Manejo de errores | ✅ Implementado |
| Refresh de tokens | ✅ Implementado |

**🎉 La integración está 100% funcional y lista para usar**

