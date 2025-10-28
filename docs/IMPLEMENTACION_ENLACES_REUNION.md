# Implementación de Enlaces de Reunión para Citas Online

## ✅ Lo que ya está implementado:

### 1. Base de datos
- ✅ Migración SQL creada: `database/migrations/82_add_meeting_link_to_appointments.sql`
- Campo `meeting_link` agregado a la tabla `appointments`

### 2. Backend
- ✅ Tipo `Appointment` actualizado con campo `meeting_link`
- ✅ Función `sendMeetingLinkNotification()` en `src/lib/email-sender.ts`
- ✅ Template de email: `database/email-templates/meeting-link-notification.html`
- ✅ API Route: `src/app/api/appointments/send-meeting-link/route.ts`

### 3. Componentes
- ✅ Componente `MeetingLinkManager` creado en `src/components/appointments/meeting-link-manager.tsx`
  - Permite al profesional agregar/editar el enlace
  - Muestra el enlace al paciente con botón "Unirse a la Reunión"
  - Envía email automático al paciente

---

## 📋 Pasos para completar la implementación:

### Paso 1: Ejecutar la migración SQL

Accede a Supabase Dashboard → SQL Editor y ejecuta:

```sql
-- Ejecutar el contenido de database/migrations/82_add_meeting_link_to_appointments.sql

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

COMMENT ON COLUMN appointments.meeting_link IS 'Enlace de reunión virtual (Zoom, Google Meet, Teams, etc.) para citas online. Solo visible para el paciente después de que la cita sea confirmada.';

CREATE INDEX IF NOT EXISTS idx_appointments_online_with_link
ON appointments(appointment_type, meeting_link)
WHERE appointment_type = 'online' AND meeting_link IS NOT NULL;
```

### Paso 2: Integrar en vista del profesional

Abre `src/app/(dashboard)/(professional)/professional/[id]/appointments/page.tsx`:

**2.1. Agregar import del componente** (línea ~40):
```typescript
import { MeetingLinkManager } from '@/components/appointments/meeting-link-manager';
```

**2.2. Agregar `meeting_link` en el query de appointments** (línea ~90):
```typescript
const { data: appointmentsData, error: appointmentsError } = await supabase
  .from('appointments')
  .select(`
    id,
    appointment_date,
    appointment_time,
    duration_minutes,
    appointment_type,
    status,
    cost,
    location,
    notes,
    patient_id,
    meeting_link,  // <-- AGREGAR ESTA LÍNEA
    created_at,
    payments (
      status,
      stripe_payment_intent_id,
      paid_at
    )
  `)
```

**2.3. Incluir `meeting_link` en el mapeo** (línea ~185):
```typescript
date: apt.appointment_date,
time: apt.appointment_time,
duration: apt.duration_minutes,
type: apt.appointment_type === 'online' ? 'Online' : 'Presencial',
status: apt.status as Appointment['status'],
notes: apt.notes || undefined,
location: apt.location || (apt.appointment_type === 'online' ? 'Online' : 'Sin especificar'),
cost: apt.cost,
isPaid: isPaid,
meeting_link: apt.meeting_link,  // <-- AGREGAR ESTA LÍNEA
```

**2.4. Agregar el componente en el modal** (después de la línea ~603, después del div de "Notas"):
```typescript
              {/* Notas */}
              {selectedAppointment.notes && (
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Notas</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Enlace de Reunión - AGREGAR ESTO */}
              {selectedAppointment.type === 'Online' && (
                <MeetingLinkManager
                  appointmentId={selectedAppointment.id}
                  appointmentType={selectedAppointment.type}
                  meetingLink={selectedAppointment.meeting_link}
                  patientEmail={selectedAppointment.patient.email}
                  patientName={selectedAppointment.patient.name}
                  appointmentDate={new Date(selectedAppointment.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  appointmentTime={selectedAppointment.time}
                  onLinkUpdated={(newLink) => {
                    // Actualizar el appointment en el estado local
                    setAppointments(prev => prev.map(apt =>
                      apt.id === selectedAppointment.id
                        ? { ...apt, meeting_link: newLink }
                        : apt
                    ));
                    setSelectedAppointment(prev =>
                      prev ? { ...prev, meeting_link: newLink } : null
                    );
                  }}
                  viewMode="professional"
                />
              )}
            </div>
          )}
```

### Paso 3: Integrar en vista del paciente

Busca la página de citas del paciente (probablemente en `src/app/(dashboard)/(patient)/patient/[id]/explore/appointments/page.tsx` o similar) y agrega:

**3.1. Import del componente:**
```typescript
import { MeetingLinkManager } from '@/components/appointments/meeting-link-manager';
```

**3.2. En el modal/card de detalles de la cita, agregar:**
```typescript
{appointment.type === 'Online' && (
  <MeetingLinkManager
    appointmentId={appointment.id}
    appointmentType={appointment.type}
    meetingLink={appointment.meeting_link}
    patientEmail={appointment.patient.email}
    patientName={appointment.patient.name}
    appointmentDate={formattedDate}
    appointmentTime={appointment.time}
    viewMode="patient"
  />
)}
```

### Paso 4: Verificar funcionamiento

1. **Crear una cita online de prueba**
2. **Como profesional:**
   - Ir a Appointments
   - Ver detalles de la cita online
   - Debería aparecer una sección azul "Enlace de Reunión Virtual"
   - Click en "Agregar Enlace"
   - Pegar un enlace (ej: https://zoom.us/j/123456789)
   - Click en "Guardar y Enviar"
   - Verificar que se envió el email al paciente

3. **Como paciente:**
   - Ir a Mis Citas
   - Ver detalles de la cita online
   - Debería aparecer el botón "Unirse a la Reunión"
   - Click en el botón debería abrir el enlace en nueva pestaña

---

## 🎨 Características implementadas:

### Para el Profesional:
- ✅ Agregar/editar enlace de reunión desde la card de la cita
- ✅ Copiar enlace al portapapeles
- ✅ Email automático al paciente cuando agrega el enlace
- ✅ Validación de URL
- ✅ Solo disponible para citas "Online"

### Para el Paciente:
- ✅ Ver enlace de reunión en la card de la cita
- ✅ Botón "Unirse a la Reunión" que abre el enlace
- ✅ Copiar enlace al portapapeles
- ✅ Email de notificación con el enlace
- ✅ Solo visible si la cita es online y el profesional agregó el enlace

### Email:
- ✅ Template profesional con diseño responsive
- ✅ Incluye detalles de la cita (fecha, hora, profesional)
- ✅ Botón destacado "Unirse a la Reunión"
- ✅ Enlace copiable en texto plano
- ✅ Consejos para la sesión virtual

---

## 📝 Notas adicionales:

- El enlace solo es editable por el profesional
- El email se envía automáticamente cada vez que se agrega/actualiza el enlace
- Soporta cualquier plataforma (Zoom, Google Meet, Teams, etc.)
- La validación asegura que sea una URL válida antes de guardar

---

## 🐛 Si algo no funciona:

1. Verificar que la migración SQL se ejecutó correctamente
2. Verificar que `RESEND_API_KEY` esté configurada en `.env.local`
3. Revisar logs en la consola del navegador
4. Revisar logs en Supabase Dashboard → Logs
5. Verificar que el componente esté importado correctamente

---

¡Listo para usar! 🎉
