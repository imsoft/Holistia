# 📅 Instrucciones para Recrear la Cita Eliminada

## 📋 Resumen de la Cita

**Paciente:**
- Nombre: Justo Torres
- Email: justoytorres@gmail.com

**Profesional:**
- Nombre: Andrea Izchel Cerezo Vazquez
- Email: andycerezo2492@gmail.com
- Profesión: Terapeuta Alternativa

**Detalles del Servicio:**
- Servicio: Limpia Energetica
- Modalidad: **Presencial**
- Fecha: **22 de octubre de 2025**
- Hora: **13:00 (1:00 PM)**
- Duración: 60 minutos
- Costo: **$700 MXN**

---

## 🚀 Pasos para Recrear la Cita

### **Opción 1: Ejecutar el Script SQL (Recomendado)**

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto de Holistia
3. Ve a la sección **SQL Editor**
4. Abre el archivo: `database/scripts/recreate_appointment_justo_torres.sql`
5. Copia TODO el contenido del script (Paso 1: Crear la cita)
6. Pégalo en el SQL Editor
7. Click en **Run**
8. ✅ La cita se habrá creado con estado "confirmed"

### **Verificar que se creó correctamente:**

Ejecuta esta query en el SQL Editor:

```sql
SELECT 
  a.id,
  a.appointment_date,
  a.appointment_time,
  a.appointment_type,
  a.status,
  a.cost,
  a.location,
  u_patient.email as patient_email,
  u_patient.raw_user_meta_data->>'first_name' as patient_first_name,
  u_patient.raw_user_meta_data->>'last_name' as patient_last_name,
  pa.first_name as professional_first_name,
  pa.last_name as professional_last_name
FROM appointments a
LEFT JOIN auth.users u_patient ON a.patient_id = u_patient.id
LEFT JOIN professional_applications pa ON a.professional_id = pa.user_id
WHERE a.patient_id = 'd89373fe-4cf4-4401-a466-0c1efe9a5937'
  AND a.professional_id = 'c47f5a3e-1050-4276-aee7-2a2f3e7c8fea'
  AND a.appointment_date = '2025-10-22'
ORDER BY a.created_at DESC;
```

Deberías ver algo como:

| appointment_date | appointment_time | appointment_type | status | cost | patient_email | professional_first_name |
|------------------|------------------|------------------|--------|------|---------------|------------------------|
| 2025-10-22 | 13:00:00 | Limpia Energetica | confirmed | 700 | justoytorres@gmail.com | Andrea Izchel |

---

## 💳 Opcional: Registrar el Pago

Si también quieres registrar el pago en la tabla `payments`:

1. **Primero anota el `appointment_id`** que obtuviste al crear la cita
2. Abre el script SQL nuevamente
3. Ve a la sección comentada "OPCIONAL: Crear registro de pago"
4. Descomenta el código (quita los `/*` y `*/`)
5. Reemplaza `<APPOINTMENT_ID>` con el ID real de la cita
6. Ejecuta ese INSERT en el SQL Editor

---

## 🔍 Dónde Verás la Cita

### **Para el Paciente (Justo Torres):**
- Dashboard de paciente → Mis citas
- Debería ver: "Limpia Energetica con Andrea Izchel - 22/10/2025 13:00"

### **Para la Profesional (Andrea Izchel):**
- Dashboard profesional → Citas
- Debería ver: "Limpia Energetica con Justo Torres - 22/10/2025 13:00"

### **Para el Admin:**
- Panel de administración → Citas
- Debería aparecer la cita con estado "confirmed"

---

## ⚠️ Notas Importantes

1. **Estado "confirmed"**: La cita se crea con estado confirmado porque ya está pagada
2. **Notificaciones**: Las notificaciones por email NO se enviarán automáticamente (porque se crea manualmente)
3. **Fecha válida**: El 22/10/2025 es un miércoles, verifica que ese día la profesional tenga disponibilidad
4. **Duración**: La cita durará 60 minutos (de 13:00 a 14:00)

---

## 🆘 Solución de Problemas

### **Error: "duplicate key value"**
Si ves este error, significa que ya existe una cita con esos datos. Verifica con la query de verificación.

### **La cita no aparece en el dashboard**
1. Verifica que el `professional_id` sea correcto (debe ser el `user_id`, no el `id` de professional_applications)
2. Refresca la página del dashboard
3. Verifica que la fecha no esté en el pasado

### **¿Necesitas cambiar la fecha u hora?**
Edita el script SQL y cambia:
- `'2025-10-22'` por la nueva fecha
- `'13:00:00'` por la nueva hora

---

## ✅ Checklist

- [ ] Ejecutar el script SQL en Supabase
- [ ] Verificar que la cita se creó correctamente
- [ ] (Opcional) Registrar el pago en la tabla payments
- [ ] Notificar manualmente a Justo Torres sobre la cita
- [ ] Notificar manualmente a Andrea Izchel sobre la cita
- [ ] Verificar que aparezca en ambos dashboards

---

¡Listo! La cita estará recreada y ambos usuarios podrán verla en sus dashboards. 🎉

