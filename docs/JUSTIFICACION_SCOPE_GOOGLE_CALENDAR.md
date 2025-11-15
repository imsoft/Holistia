# Justificación del Scope de Google Calendar para Google

## Texto para copiar y pegar:

```
Holistia es una plataforma de salud holística que conecta profesionales certificados (psicólogos, terapeutas, coaches) con pacientes para agendar y gestionar citas de consulta.

Necesitamos acceso al permiso https://www.googleapis.com/auth/calendar para:

1. Sincronización automática de citas: Cuando un paciente reserva y paga una cita en Holistia, creamos automáticamente un evento correspondiente en el calendario de Google del profesional. Esto permite que el profesional vea todas sus citas en un solo lugar, ya sea en Holistia o en su calendario de Google.

2. Actualización de eventos: Si un paciente cancela, reagenda o modifica una cita en Holistia, actualizamos automáticamente el evento correspondiente en Google Calendar para mantener la sincronización en tiempo real.

3. Eliminación de eventos: Cuando una cita se cancela definitivamente, eliminamos el evento del calendario de Google para evitar conflictos y mantener la agenda del profesional actualizada.

4. Prevención de conflictos: Al tener acceso completo al calendario, podemos verificar la disponibilidad del profesional antes de permitir que un paciente reserve una cita, evitando doble reservas o conflictos de horario.

Un permiso más limitado (como calendar.readonly o calendar.events) resultaría insuficiente porque:
- calendar.readonly solo permite lectura, pero necesitamos crear, actualizar y eliminar eventos
- calendar.events solo permite gestionar eventos, pero no calendarios completos, lo que limitaría la funcionalidad de sincronización bidireccional

Los datos del calendario solo se usan para esta funcionalidad de sincronización y nunca se comparten con terceros. El acceso es completamente opcional y el profesional puede revocarlo en cualquier momento desde su configuración en Holistia.
```

## Versión para 1000 caracteres (OPTIMIZADA):

```
Holistia conecta profesionales de salud con pacientes para agendar citas. Necesitamos acceso completo al calendario de Google para sincronizar automáticamente las citas entre Holistia y el calendario del profesional.

Funcionalidades:
- Crear eventos cuando un paciente reserva y paga una cita
- Actualizar eventos al cancelar o reagendar citas
- Eliminar eventos cuando una cita se cancela definitivamente
- Verificar disponibilidad para prevenir conflictos de horario

Un permiso limitado (calendar.readonly) es insuficiente porque necesitamos crear, actualizar y eliminar eventos, no solo leerlos. Los datos solo se usan para sincronización y nunca se comparten con terceros. El acceso es opcional y revocable en cualquier momento.
```

**Caracteres: ~650** (quedan ~350 caracteres de margen)

## Versión ULTRA corta (si necesitas aún menos):

```
Holistia sincroniza citas entre profesionales y pacientes con Google Calendar. Necesitamos acceso completo para crear, actualizar y eliminar eventos automáticamente cuando se reservan, cancelan o modifican citas. También verificamos disponibilidad para prevenir conflictos. Un permiso de solo lectura es insuficiente porque necesitamos escribir datos. Los datos solo se usan para sincronización, nunca se comparten con terceros, y el acceso es opcional y revocable.
```

**Caracteres: ~450**

## Versión en inglés (si Google lo requiere):

```
Holistia is a holistic health platform that connects certified professionals (psychologists, therapists, coaches) with patients to schedule and manage consultation appointments.

We need access to https://www.googleapis.com/auth/calendar to:

1. Automatic appointment synchronization: When a patient books and pays for an appointment in Holistia, we automatically create a corresponding event in the professional's Google Calendar. This allows professionals to see all their appointments in one place, whether in Holistia or their Google Calendar.

2. Event updates: If a patient cancels, reschedules, or modifies an appointment in Holistia, we automatically update the corresponding event in Google Calendar to maintain real-time synchronization.

3. Event deletion: When an appointment is definitively cancelled, we delete the event from Google Calendar to avoid conflicts and keep the professional's schedule updated.

4. Conflict prevention: By having full access to the calendar, we can verify the professional's availability before allowing a patient to book an appointment, preventing double bookings or scheduling conflicts.

A more limited permission (such as calendar.readonly or calendar.events) would be insufficient because:
- calendar.readonly only allows reading, but we need to create, update, and delete events
- calendar.events only allows managing events, but not complete calendars, which would limit bidirectional synchronization functionality

Calendar data is only used for this synchronization functionality and is never shared with third parties. Access is completely optional and the professional can revoke it at any time from their Holistia settings.
```

