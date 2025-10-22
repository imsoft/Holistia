# Sistema de Recordatorios de Renovación de Inscripción

## Descripción General

Sistema automático de emails para recordar a los profesionales que su inscripción anual está por expirar o ya expiró. Los emails se envían automáticamente en momentos clave antes y después de la fecha de expiración.

## 📧 Tipos de Recordatorios

### 1. 30 Días Antes de Expiración
- **Subject:** 🔔 Tu inscripción en Holistia expira en 30 días
- **Color:** Amarillo/Naranja (#f59e0b)
- **Tono:** Informativo, amigable
- **Objetivo:** Notificar con tiempo suficiente para renovar

### 2. 15 Días Antes de Expiración
- **Subject:** ⚠️ Tu inscripción en Holistia expira en 15 días
- **Color:** Naranja (#f97316)
- **Tono:** Alerta moderada
- **Objetivo:** Segundo recordatorio para quienes no renovaron

### 3. 7 Días Antes de Expiración
- **Subject:** 🚨 ¡Urgente! Tu inscripción en Holistia expira en 7 días
- **Color:** Rojo (#ef4444)
- **Tono:** Urgente
- **Objetivo:** Última oportunidad antes de expirar

### 4. Después de Expiración
- **Subject:** ❌ Tu inscripción en Holistia ha expirado
- **Color:** Rojo Oscuro (#dc2626)
- **Tono:** Crítico pero motivador
- **Objetivo:** Informar que ya no aparecen y motivar a renovar

## ⚙️ Configuración Técnica

### Cron Job en Vercel

El sistema se ejecuta **diariamente a las 10:00 AM (hora del servidor)** mediante Vercel Cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/registration-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

**Formato del schedule:** `0 10 * * *`
- `0` - Minuto 0
- `10` - Hora 10 (10:00 AM)
- `*` - Todos los días del mes
- `*` - Todos los meses
- `*` - Todos los días de la semana

### Variables de Entorno Necesarias

Asegúrate de tener estas variables en tu archivo `.env.local` y en Vercel:

```env
# Resend API (para envío de emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# URL del sitio (para links en emails)
NEXT_PUBLIC_SITE_URL=https://www.holistia.io

# Secret para autenticar el cron job (genera uno único)
CRON_SECRET=tu_secret_aleatorio_muy_seguro_aqui
```

**Para generar `CRON_SECRET`:**
```bash
openssl rand -base64 32
```

### Base de Datos

**Tabla:** `email_logs`

Registra todos los emails enviados para:
- Evitar duplicados (no enviar el mismo recordatorio 2 veces en 24h)
- Auditoría y monitoreo
- Estadísticas de emails enviados

**Columnas principales:**
- `recipient_email` - Email del destinatario
- `recipient_id` - ID del usuario
- `email_type` - Tipo de recordatorio enviado
- `sent_at` - Fecha y hora de envío
- `status` - Estado: sent, failed, bounced
- `metadata` - Datos adicionales (días hasta expiración, etc.)

## 🔄 Flujo de Funcionamiento

### 1. Ejecución Diaria (10:00 AM)
```
Vercel Cron → /api/cron/registration-reminders
```

### 2. Verificación de Seguridad
- Valida que la solicitud tenga el header `Authorization: Bearer ${CRON_SECRET}`
- Rechaza solicitudes no autorizadas

### 3. Consulta de Profesionales
El cron busca profesionales que:
- Tengan `status = 'approved'`
- Tengan `registration_fee_paid = true`
- Su `registration_fee_expires_at` esté:
  - Dentro de los próximos 30 días, O
  - Ya haya expirado hace menos de 7 días

### 4. Clasificación por Días Restantes
Para cada profesional:
- Calcula días hasta expiración
- Determina tipo de recordatorio a enviar
- Verifica si ya se envió en las últimas 24h

### 5. Envío de Email
Si procede enviar:
- Carga plantilla HTML
- Reemplaza variables (nombre, fecha, link, etc.)
- Envía vía Resend
- Registra en `email_logs`

### 6. Respuesta JSON
```json
{
  "success": true,
  "message": "Reminder process completed",
  "results": {
    "sent": 5,
    "failed": 0,
    "skipped": 2,
    "details": [
      { "email": "prof@example.com", "status": "sent", "type": "30_days" }
    ]
  },
  "timestamp": "2025-10-22T10:00:00.000Z"
}
```

## 📋 Plantilla de Email

**Ubicación:** `database/email-templates/registration-renewal-reminder.html`

**Variables disponibles:**
- `{{professional_name}}` - Nombre completo del profesional
- `{{reminder_message}}` - Mensaje específico según días restantes
- `{{expiration_date}}` - Fecha de expiración formateada
- `{{renewal_link}}` - Link para renovar inscripción
- `{{color}}` - Color del borde según urgencia

**Secciones del email:**
1. Header con gradiente morado
2. Mensaje personalizado según días restantes
3. Info box con fecha de expiración y monto
4. Botón CTA "Renovar Ahora"
5. Sección "¿Qué pasa si no renuevo?"
6. Sección "Beneficios de renovar"
7. Footer con links y copyright

## 🚀 Despliegue en Producción

### Paso 1: Aplicar Migración de Base de Datos

Ve a Supabase SQL Editor y ejecuta:
```sql
-- Migración 55: Crear tabla email_logs
-- Ver: database/migrations/55_create_email_logs_table.sql
```

O usa Supabase CLI:
```bash
supabase db push
```

### Paso 2: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `RESEND_API_KEY`
   - `CRON_SECRET` (genera uno nuevo con `openssl rand -base64 32`)
   - Verifica que `NEXT_PUBLIC_SITE_URL` esté correcta

### Paso 3: Deploy a Producción

```bash
pnpm build
git push origin main
```

Vercel desplegará automáticamente y el cron se activará.

### Paso 4: Verificar que el Cron Funciona

En Vercel:
1. Ve a tu proyecto → Deployments
2. Selecciona el último deployment
3. Ve a "Functions" tab
4. Busca el cron job y revisa los logs

## 🧪 Pruebas

### Probar Localmente (Desarrollo)

```bash
# En una terminal
pnpm dev

# En otra terminal
curl -X GET http://localhost:3000/api/cron/registration-reminders \
  -H "Authorization: Bearer tu_cron_secret_local"
```

### Probar en Producción

**Opción 1: Esperar al cron automático**
- Se ejecuta diariamente a las 10:00 AM

**Opción 2: Trigger manual desde Vercel**
1. Ve a tu proyecto en Vercel
2. Settings → Cron Jobs
3. Click en "Trigger" para el cron de registration-reminders

**Opción 3: cURL manual**
```bash
curl -X GET https://www.holistia.io/api/cron/registration-reminders \
  -H "Authorization: Bearer tu_cron_secret_produccion"
```

### Verificar Resultados

**Ver emails enviados en los últimos 7 días:**
```sql
SELECT 
  email_type,
  recipient_email,
  subject,
  sent_at,
  status,
  metadata
FROM email_logs
WHERE sent_at >= NOW() - INTERVAL '7 days'
ORDER BY sent_at DESC;
```

**Estadísticas de recordatorios:**
```sql
SELECT 
  email_type,
  COUNT(*) as total_sent,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM email_logs
WHERE email_type LIKE 'registration_renewal_%'
  AND sent_at >= NOW() - INTERVAL '30 days'
GROUP BY email_type
ORDER BY total_sent DESC;
```

## 📊 Monitoreo

### Queries Útiles

**Profesionales que recibirán recordatorio hoy:**
```sql
SELECT 
  first_name,
  last_name,
  email,
  registration_fee_expires_at,
  EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) as dias_restantes,
  CASE 
    WHEN EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) <= 0 THEN 'Expirado'
    WHEN EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) <= 7 THEN '7 días'
    WHEN EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) <= 15 THEN '15 días'
    WHEN EXTRACT(DAY FROM (registration_fee_expires_at - NOW())) <= 30 THEN '30 días'
    ELSE 'No aplica'
  END as tipo_recordatorio
FROM professional_applications
WHERE status = 'approved'
  AND registration_fee_paid = TRUE
  AND registration_fee_expires_at <= NOW() + INTERVAL '30 days'
ORDER BY registration_fee_expires_at ASC;
```

**Efectividad de recordatorios:**
```sql
-- Profesionales que renovaron después de recibir recordatorio
SELECT 
  pa.first_name,
  pa.last_name,
  pa.email,
  el.sent_at as recordatorio_enviado,
  pa.registration_fee_paid_at as fecha_renovacion,
  EXTRACT(DAY FROM (pa.registration_fee_paid_at - el.sent_at)) as dias_para_renovar
FROM email_logs el
JOIN professional_applications pa ON el.recipient_id = pa.user_id
WHERE el.email_type LIKE 'registration_renewal_%'
  AND pa.registration_fee_paid_at > el.sent_at
  AND pa.registration_fee_paid_at <= el.sent_at + INTERVAL '30 days'
ORDER BY el.sent_at DESC;
```

## 🔧 Personalización

### Cambiar Horario del Cron

Edita `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/registration-reminders",
      "schedule": "0 14 * * *"  // 2:00 PM en lugar de 10:00 AM
    }
  ]
}
```

### Agregar Nuevos Tipos de Recordatorio

En `src/app/api/cron/registration-reminders/route.ts`:

```typescript
const REMINDER_TYPES: Record<string, ReminderType> = {
  // ... tipos existentes
  '3_days': {  // Nuevo recordatorio a 3 días
    type: '3_days',
    message: 'Tu inscripción expira en solo 3 días...',
    subject: '🔴 ¡Últimos días! Tu inscripción expira pronto',
    color: '#dc2626',
  },
};
```

Y actualiza la función `getReminderType`:
```typescript
function getReminderType(daysUntilExpiration: number): ReminderType | null {
  if (daysUntilExpiration <= 0) {
    return REMINDER_TYPES.expired;
  } else if (daysUntilExpiration <= 3) {  // Nuevo
    return REMINDER_TYPES['3_days'];
  } else if (daysUntilExpiration <= 7) {
    return REMINDER_TYPES['7_days'];
  }
  // ...
}
```

### Personalizar Plantilla de Email

Edita `database/email-templates/registration-renewal-reminder.html`:
- Cambia colores, fuentes, estilos
- Agrega o elimina secciones
- Modifica el tono del mensaje

## ⚠️ Prevención de Duplicados

El sistema evita enviar el mismo recordatorio múltiples veces:
- Verifica `email_logs` antes de enviar
- No envía el mismo tipo de recordatorio 2 veces en 24 horas
- Ejemplo: Si se envió "30_days" hoy, no se vuelve a enviar hasta mañana

## 🐛 Troubleshooting

### El cron no se ejecuta
1. Verifica que `vercel.json` esté en la raíz del proyecto
2. Revisa que el deploy en Vercel se completó exitosamente
3. Ve a Vercel → Settings → Cron Jobs y verifica que esté listado
4. Revisa los logs en Vercel → Functions

### Los emails no se envían
1. Verifica `RESEND_API_KEY` en variables de entorno
2. Revisa logs del cron para ver errores específicos
3. Verifica que el dominio esté verificado en Resend
4. Revisa la tabla `email_logs` para ver intentos fallidos

### Se envían duplicados
1. Verifica que la tabla `email_logs` exista
2. Revisa que los índices estén creados correctamente
3. Verifica la lógica de deduplicación en el código

### El link de renovación no funciona
1. Verifica `NEXT_PUBLIC_SITE_URL` en variables de entorno
2. Asegúrate de que termina sin `/` al final
3. Prueba el link manualmente

## 📈 Próximas Mejoras

Ideas para futuras versiones:

1. **Panel de administración**
   - Dashboard para ver estadísticas de recordatorios
   - Posibilidad de enviar recordatorios manuales
   - Ver tasa de conversión (renovaciones después de recordatorio)

2. **Recordatorios personalizados**
   - Permitir a profesionales elegir cuándo recibir recordatorios
   - Opción de pausar recordatorios si ya renovaron

3. **Múltiples canales**
   - SMS además de email
   - Notificaciones push en la app
   - WhatsApp Business API

4. **A/B Testing**
   - Probar diferentes mensajes
   - Optimizar horarios de envío
   - Mejorar tasa de conversión

---

**Fecha de creación:** 22 de octubre de 2025  
**Última actualización:** 22 de octubre de 2025  
**Versión:** 1.0.0

